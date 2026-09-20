// 模板渲染引擎（导出端）—— 用 Canvas 确定性合成 9:16 记忆卡（1080 × 1920）
//
// 设计原则：
//   - 消费 templates.js 的 slots 配置（与预览共用同一份 layout config）
//   - 照片只决定裁切内容，绝不改变 slot 尺寸
//   - cover 裁切 + focalPoint；Hero 支持 rectangle / circle / organic 遮罩
//   - 装饰元素（纸层 / 胶带 / 印章 / 星点 / 手绘线 / 纸纹）全部矢量绘制
//   - 文本严格限长，超长只截断，绝不推动布局

import { RESTAURANT } from '../data/photos'
import {
  CANVAS_W as W,
  CANVAS_H as H,
  getTemplate,
} from './templates'
import { semantic } from './designTokens'
import {
  assignPhotosToSlots,
  clampText,
  computeContainFit,
  computeCoverCrop,
  resolveFocal,
} from './layoutEngine'
import {
  drawDateStamp,
  drawDot,
  drawHandDrawnLine,
  drawMemoryNumber,
  drawPaperLayer,
  drawPaperTexture,
  drawSmallStar,
  drawTape,
  maskPath,
  renderHeroMask,
  roundRectPath,
} from './decor'

// ---- 底层绘图工具 ----

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function circlePath(ctx, cx, cy, r) {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.closePath()
}

// 在 slot 内绘制照片（cover 裁切 + focalPoint + 遮罩类型）
function drawSlotPhoto(ctx, img, slot, focal) {
  const { x, y, width, height, radius = 0, shadow = true, mask = 'rectangle', rotate = 0 } = slot

  ctx.save()
  if (rotate) {
    ctx.translate(x + width / 2, y + height / 2)
    ctx.rotate((rotate * Math.PI) / 180)
    ctx.translate(-(x + width / 2), -(y + height / 2))
  }

  if (shadow) {
    ctx.save()
    ctx.shadowColor = semantic.softShadowDeep
    ctx.shadowBlur = 40
    ctx.shadowOffsetY = 14
    maskPath(ctx, mask, x, y, width, height, radius)
    ctx.fillStyle = semantic.surfacePaper
    ctx.fill()
    ctx.restore()
  }

  const crop = computeCoverCrop(img.width, img.height, width, height, focal)
  renderHeroMask(ctx, img, slot, mask, crop)
  ctx.restore()
}

// 抠图主体（透明 PNG，contain 适配，尺寸恒定）
function drawSlotCutout(ctx, img, slot) {
  const { x, y, width, height } = slot
  const { dx, dy, dw, dh } = computeContainFit(img.width, img.height, width, height)
  ctx.save()
  ctx.shadowColor = semantic.softShadowDeep
  ctx.shadowBlur = 60
  ctx.shadowOffsetY = 26
  ctx.drawImage(img, x + dx, y + dy, dw, dh)
  ctx.restore()
}

// 文字换行绘制（按字符，适配中文；受 maxLines 限制）
function drawWrapped(ctx, text, x, y, maxWidth, lineHeight, maxLines = 99, align = 'left') {
  const chars = String(text || '').split('')
  const lines = []
  let line = ''
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = ch
      if (lines.length >= maxLines) break
    } else {
      line = test
    }
  }
  if (line && lines.length < maxLines) lines.push(line)

  ctx.textAlign = align
  let cy = y
  for (const l of lines) {
    ctx.fillText(l, x, cy)
    cy += lineHeight
  }
  return cy
}

// 品牌页眉（餐厅名 + 英文名 + 天蓝细线）
function drawBrandHeader(ctx, { light = false } = {}) {
  const main = light ? semantic.surfacePaper : semantic.textPrimary
  const soft = light ? 'rgba(255,253,248,0.75)' : semantic.textSecondary

  ctx.textAlign = 'center'
  ctx.fillStyle = main
  ctx.font = '600 40px "PingFang SC", "Noto Sans SC", sans-serif'
  ctx.fillText(RESTAURANT.name, W / 2, 118)

  ctx.fillStyle = soft
  ctx.font = '500 20px "PingFang SC", "Noto Sans SC", sans-serif'
  ctx.fillText(RESTAURANT.englishName, W / 2, 156)

  ctx.strokeStyle = light ? 'rgba(255,253,248,0.55)' : semantic.decorativeLine
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(W / 2 - 60, 186)
  ctx.lineTo(W / 2 + 60, 186)
  ctx.stroke()
}

// 品牌页脚（日期 + 口号）
function drawBrandFooter(ctx, story, { light = false } = {}) {
  const soft = light ? 'rgba(255,253,248,0.7)' : semantic.textMuted
  ctx.textAlign = 'center'
  ctx.fillStyle = soft
  ctx.font = '400 26px "PingFang SC", "Noto Sans SC", sans-serif'
  ctx.fillText(`${story?.date || ''}   ·   ${RESTAURANT.tagline}`, W / 2, H - 70)
}

// 暖色暗角
function drawVignette(ctx) {
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.78)
  v.addColorStop(0, 'rgba(122,90,62,0)')
  v.addColorStop(1, 'rgba(122,90,62,0.10)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, W, H)
}

// ---- 通用绘制流程 ----

function drawBackground(ctx, tpl) {
  const bg = tpl.background || {}
  if (bg.type === 'linear') {
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, bg.from || semantic.backgroundPrimary)
    if (bg.mid) grad.addColorStop(0.55, bg.mid)
    grad.addColorStop(1, bg.to || '#efe4d0')
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = semantic.backgroundPrimary
  }
  ctx.fillRect(0, 0, W, H)
}

function drawPaperLayers(ctx, tpl) {
  for (const p of tpl.paperLayers || []) {
    drawPaperLayer(ctx, p.x, p.y, p.width, p.height, p.radius, {
      fill: p.fill,
      shadow: p.shadow,
      rotate: p.rotate,
    })
  }
}

function drawBadge(ctx, badge) {
  if (!badge) return
  ctx.save()
  ctx.fillStyle = badge.bg || semantic.brandAccent
  roundRectPath(ctx, badge.x, badge.y, badge.width, badge.height, badge.radius || badge.height / 2)
  ctx.fill()
  ctx.fillStyle = badge.color || semantic.surfacePaper
  ctx.font = '600 28px "PingFang SC", "Noto Sans SC", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(badge.text, badge.x + badge.width / 2, badge.y + badge.height / 2 + 2)
  ctx.restore()
}

function drawTextBlocks(ctx, tpl, caption) {
  for (const tb of tpl.textBlocks || []) {
    const text = clampText(caption, tb.limit)
    ctx.save()
    ctx.fillStyle = tb.color || semantic.textPrimary
    ctx.font = `500 ${tb.size}px "PingFang SC", "Noto Sans SC", sans-serif`
    ctx.textBaseline = 'alphabetic'
    drawWrapped(ctx, text, tb.x, tb.y, tb.maxWidth, tb.lineHeight, tb.maxLines, tb.align)
    ctx.restore()
  }
}

function drawLines(ctx, tpl) {
  for (const l of tpl.lines || []) {
    drawHandDrawnLine(ctx, { x: l.x, y: l.y, width: l.width })
  }
}

function drawMeta(ctx, tpl, story) {
  const m = tpl.meta
  if (!m) return
  const text = `${story?.date || ''}   ·   ${RESTAURANT.location}`
  drawDateStamp(ctx, { x: m.x, y: m.y, text, size: m.size, color: m.color, align: m.align })
}

function drawDecorations(ctx, tpl, story) {
  const d = tpl.decorative || {}

  // 记忆编号（位置由模板配置，预览/导出共用）
  if (d.memoryNumber) {
    const mn = tpl.memoryNumber || { x: 90, y: 230 }
    drawMemoryNumber(ctx, { x: mn.x, y: mn.y, number: tpl.index || '01' })
  }

  // 星 / 点
  for (const s of tpl.stars || []) drawSmallStar(ctx, s)
  for (const p of tpl.dots || []) drawDot(ctx, p)

  // 手写注释（文案由模板配置，预览/导出共用）
  if (tpl.annotation) {
    ctx.save()
    ctx.translate(tpl.annotation.x, tpl.annotation.y)
    ctx.rotate(((tpl.annotation.rotate || 0) * Math.PI) / 180)
    ctx.font = `400 ${tpl.annotation.size}px "PingFang SC", "Noto Sans SC", sans-serif`
    ctx.fillStyle = tpl.annotation.color || semantic.memoryAccent
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(tpl.annotation.text || '今晚，值得记住', 0, 0)
    ctx.restore()
  }

  // 日期印章
  if (tpl.stamp) {
    drawDateStamp(ctx, {
      x: tpl.stamp.x,
      y: tpl.stamp.y,
      text: story?.date || '',
      size: tpl.stamp.size,
      rotate: tpl.stamp.rotate,
    })
  }

  // 胶带（最多 2 处，绘制在照片之上）
  for (const t of tpl.tapes || []) {
    drawTape(ctx, t)
  }
}

// ---- 主导出 ----

/**
 * 渲染记忆卡为 dataURL。
 * @param {object} opts
 * @param {string} opts.templateId 模板 id（editorial / collage / classic）
 * @param {Array}  opts.photos     照片数组 [{ src, role, focalPoint }]
 * @param {object} opts.story      故事对象
 * @param {string} opts.caption    短文案
 * @param {object} opts.heroCutout 可选：{ src, isCutout } 抠图结果
 * @returns {Promise<string>} JPEG dataURL
 */
export async function renderTemplate({ templateId, photos = [], story = {}, caption = '', heroCutout = null }) {
  const tpl = getTemplate(templateId)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // 照片 → slot 分配（确定性）
  const slotPhotos = assignPhotosToSlots(tpl.slots, photos)

  // 预加载所有 slot 图片
  const loaded = {}
  for (const slot of tpl.slots) {
    const photo = slotPhotos[slot.id]
    if (!photo?.src) {
      loaded[slot.id] = null
      continue
    }
    const img = await loadImage(photo.src).catch(() => null)
    loaded[slot.id] = img ? { img, photo } : null
  }

  // 抠图主体（若提供）
  let cutoutImg = null
  if (heroCutout?.src && heroCutout.isCutout) {
    cutoutImg = await loadImage(heroCutout.src).catch(() => null)
  }

  // 绘制顺序：背景 → 纸层 → 页眉 → 照片 slots → 徽标 → 装饰 → 文本 → 页脚 → 纸纹 → 暗角
  drawBackground(ctx, tpl)
  drawPaperLayers(ctx, tpl)
  drawBrandHeader(ctx)

  for (const slot of tpl.slots) {
    const entry = loaded[slot.id]
    if (!entry) continue

    if (slot.id === 'hero' && cutoutImg) {
      drawSlotCutout(ctx, cutoutImg, slot)
      continue
    }

    const focal = resolveFocal(slot, entry.photo)
    drawSlotPhoto(ctx, entry.img, slot, focal)
  }

  drawBadge(ctx, tpl.badge)
  drawLines(ctx, tpl)
  drawDecorations(ctx, tpl, story)
  drawMeta(ctx, tpl, story)
  drawTextBlocks(ctx, tpl, caption || tpl.caption)
  drawBrandFooter(ctx, story)
  drawPaperTexture(ctx, W, H, tpl.paperTexture)
  drawVignette(ctx)

  return canvas.toDataURL('image/jpeg', 0.95)
}
