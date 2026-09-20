// Art Zine 真实渲染器 —— 把「用户自己的三张照片」编排成 1080×1920 的一页
//
// 与 01–03 模板引擎（renderTemplate.js）的区别：
//   · renderTemplate 是「确定性排版」——照片被放进固定槽位
//   · artZineRender 是「被编排的作品」——三张照片承担不同角色，非等权矩形
//
// 内容逻辑（核心）：
//   atmosphere（空间氛围）→ spatial anchor   空间锚点：大留白中的一块真实摄影
//   hero（招牌主角）      → visual protagonist 视觉主角：有机遮罩裁切，占据视觉主导
//   memory（记忆瞬间）    → emotional fragment 情感碎片：小尺寸撕边碎片，斜置于留白
//
// 视觉语言（与品牌一致，非第三方模板）：
//   暖米色纸面 / 咖啡棕文字 / 柔天蓝手绘线 / 奶油白纸层
//   超大中文主句 + 极小英文元数据 + 纸纹 + 大留白 + 非对称构图
//
// 输出：dataURL（image/jpeg），可直接展示、下载、分享。
// 未来接入服务端生成时，本模块可作为「本地兜底渲染器」保留。

import { semantic, primitive } from './designTokens'
import { roundRectPath, organicPath, drawPaperTexture } from './decor'

export const ART_ZINE_WIDTH = 1080
export const ART_ZINE_HEIGHT = 1920

// 字体族（与全局一致：汇文明朝体优先，回退系统衬线）
const SERIF = '"Huiwen-mincho", "Songti SC", "Noto Serif SC", serif'
const SANS = '"PingFang SC", "Helvetica Neue", Arial, sans-serif'

/**
 * 渲染 Art Zine 成品图。
 *
 * @param {object}   opts
 * @param {object}   opts.heroPhoto     主角照片 { src, focalPoint }
 * @param {object}   opts.supportPhoto1 支持照片 1（空间氛围）
 * @param {object}   opts.supportPhoto2 支持照片 2（记忆瞬间）
 * @param {string}   opts.memoryText    主短句（≤12 字）
 * @param {object}   opts.restaurantInfo { name, englishName, location }
 * @param {object}   opts.brandTokens   品牌令牌（默认 buildBrandTokens()）
 * @returns {Promise<{ url: string, source: 'local', meta: object }>}
 */
export async function renderArtZine({
  heroPhoto = null,
  supportPhoto1 = null,
  supportPhoto2 = null,
  memoryText = '',
  restaurantInfo = {},
  brandTokens = null,
} = {}) {
  const tokens = brandTokens || defaultTokens()

  // 加载三张真实照片（缺图时优雅降级，不阻塞整体渲染）
  const [heroImg, sup1Img, sup2Img] = await Promise.all([
    loadImageSafe(heroPhoto?.src),
    loadImageSafe(supportPhoto1?.src),
    loadImageSafe(supportPhoto2?.src),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = ART_ZINE_WIDTH
  canvas.height = ART_ZINE_HEIGHT
  const ctx = canvas.getContext('2d')

  // ---- 1. 纸面底色（暖米色 + 极淡纸纹）----
  drawPaperBase(ctx, tokens)

  // ---- 2. 空间锚点：氛围照，大留白中的一块真实摄影（非对称，偏上偏左）----
  const anchorSlot = { x: 96, y: 150, width: 620, height: 430, radius: 6 }
  if (sup1Img) {
    drawPhotoCover(ctx, sup1Img, anchorSlot, supportPhoto1?.focalPoint, { radius: 6 })
    drawHairline(ctx, anchorSlot.x, anchorSlot.y + anchorSlot.height + 22, 180, tokens)
  }

  // ---- 3. 视觉主角：招牌菜，有机遮罩裁切，占据视觉主导（偏右下，压住留白）----
  const heroSlot = { x: 300, y: 620, width: 700, height: 700 }
  if (heroImg) {
    drawOrganicPhoto(ctx, heroImg, heroSlot, heroPhoto?.focalPoint, tokens)
  }

  // ---- 4. 情感碎片：记忆瞬间，小尺寸撕边碎片，斜置于留白（左下）----
  const fragSlot = { x: 92, y: 1180, width: 300, height: 300, rotate: -4.5 }
  if (sup2Img) {
    drawFragmentPhoto(ctx, sup2Img, fragSlot, supportPhoto2?.focalPoint, tokens)
  }

  // ---- 5. 超大中文主句（视觉节奏核心，置于下方留白）----
  drawMemoryPhrase(ctx, memoryText, tokens)

  // ---- 6. 极小英文元数据（编辑感，克制）----
  drawMeta(ctx, restaurantInfo, tokens)

  // ---- 7. 手绘蓝线（品牌签名，唯一装饰）----
  drawHandLine(ctx, 96, 1742, 220, tokens)

  // ---- 8. 纸纹叠加（极低透明度，统一质感）----
  drawPaperTexture(ctx, ART_ZINE_WIDTH, ART_ZINE_HEIGHT, 0.035)

  const url = canvas.toDataURL('image/jpeg', 0.92)

  return {
    url,
    source: 'local',
    meta: {
      width: ART_ZINE_WIDTH,
      height: ART_ZINE_HEIGHT,
      hasHero: !!heroImg,
      hasSupport1: !!sup1Img,
      hasSupport2: !!sup2Img,
      memoryText,
      restaurant: restaurantInfo?.name || '',
      tokens,
    },
  }
}

// ============================================================
// 绘制原语
// ============================================================

function drawPaperBase(ctx, tokens) {
  ctx.fillStyle = tokens.warmBeige
  ctx.fillRect(0, 0, ART_ZINE_WIDTH, ART_ZINE_HEIGHT)

  // 顶部极淡的暖色渐层，制造纸面受光感（非渐变卡片，仅氛围）
  const g = ctx.createLinearGradient(0, 0, 0, ART_ZINE_HEIGHT)
  g.addColorStop(0, 'rgba(255,253,248,0.55)')
  g.addColorStop(0.45, 'rgba(255,253,248,0.0)')
  g.addColorStop(1, 'rgba(214,192,160,0.16)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, ART_ZINE_WIDTH, ART_ZINE_HEIGHT)
}

// 空间锚点：矩形真实摄影（克制、无阴影，像被贴在纸上的照片）
function drawPhotoCover(ctx, img, slot, focal, { radius = 0 } = {}) {
  const crop = computeCoverCrop(img, slot.width, slot.height, focal)
  ctx.save()
  roundRectPath(ctx, slot.x, slot.y, slot.width, slot.height, radius)
  ctx.clip()
  ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, slot.x, slot.y, slot.width, slot.height)
  ctx.restore()
}

// 视觉主角：有机遮罩 + 柔和纸影（占据视觉主导）
function drawOrganicPhoto(ctx, img, slot, focal, tokens) {
  const crop = computeCoverCrop(img, slot.width, slot.height, focal)
  ctx.save()
  // 纸影：让主角像一张被剪下的照片浮在纸面上
  ctx.shadowColor = tokens.softShadow
  ctx.shadowBlur = 46
  ctx.shadowOffsetY = 18
  organicPath(ctx, slot.x, slot.y, slot.width, slot.height)
  ctx.fillStyle = tokens.creamWhite
  ctx.fill()
  ctx.restore()

  ctx.save()
  organicPath(ctx, slot.x, slot.y, slot.width, slot.height)
  ctx.clip()
  ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, slot.x, slot.y, slot.width, slot.height)
  ctx.restore()
}

// 情感碎片：小尺寸 + 微旋转 + 奶油白纸边（像从相册里撕下的一角）
function drawFragmentPhoto(ctx, img, slot, focal, tokens) {
  const pad = 12
  const inner = {
    x: slot.x + pad,
    y: slot.y + pad,
    width: slot.width - pad * 2,
    height: slot.height - pad * 2,
  }
  const crop = computeCoverCrop(img, inner.width, inner.height, focal)

  ctx.save()
  ctx.translate(slot.x + slot.width / 2, slot.y + slot.height / 2)
  ctx.rotate((slot.rotate * Math.PI) / 180)
  ctx.translate(-(slot.x + slot.width / 2), -(slot.y + slot.height / 2))

  // 纸边
  ctx.shadowColor = tokens.softShadow
  ctx.shadowBlur = 30
  ctx.shadowOffsetY = 10
  roundRectPath(ctx, slot.x, slot.y, slot.width, slot.height, 4)
  ctx.fillStyle = tokens.creamWhite
  ctx.fill()
  ctx.shadowColor = 'transparent'

  // 照片
  ctx.save()
  roundRectPath(ctx, inner.x, inner.y, inner.width, inner.height, 2)
  ctx.clip()
  ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, inner.x, inner.y, inner.width, inner.height)
  ctx.restore()

  ctx.restore()
}

// 超大中文主句 —— 视觉节奏核心
function drawMemoryPhrase(ctx, text, tokens) {
  const phrase = (text || '今晚，值得记住。').trim()
  const chars = Array.from(phrase)

  // 自动折行：每行最多 6 字，最多 2 行（保证大留白与可读性）
  const perLine = 6
  const lines = []
  for (let i = 0; i < chars.length && lines.length < 2; i += perLine) {
    lines.push(chars.slice(i, i + perLine).join(''))
  }

  const fontSize = lines.length > 1 ? 104 : 118
  ctx.save()
  ctx.fillStyle = tokens.textPrimary
  ctx.font = `700 ${fontSize}px ${SERIF}`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'

  const startY = 1330
  const lineHeight = fontSize * 1.28
  lines.forEach((line, i) => {
    ctx.fillText(line, 96, startY + i * lineHeight)
  })
  ctx.restore()
}

// 极小英文元数据 —— 编辑感
function drawMeta(ctx, restaurantInfo, tokens) {
  const name = restaurantInfo?.englishName || 'Sonho Kitchen'
  const location = restaurantInfo?.location || ''
  const date = formatToday()

  ctx.save()
  ctx.fillStyle = tokens.textMuted
  ctx.font = `400 22px ${SANS}`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'

  const meta = [name.toUpperCase(), location, date].filter(Boolean).join('   ·   ')
  ctx.fillText(meta, 96, 1790)
  ctx.restore()
}

// 手绘蓝线 —— 品牌签名
function drawHandLine(ctx, x, y, width, tokens) {
  ctx.save()
  ctx.strokeStyle = tokens.decorativeLine
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x, y)
  // 轻微起伏，模拟手绘（确定性，非随机）
  ctx.quadraticCurveTo(x + width * 0.5, y - 7, x + width, y + 2)
  ctx.stroke()
  ctx.restore()
}

// 细分隔线（空间锚点下方，编辑感）
function drawHairline(ctx, x, y, width, tokens) {
  ctx.save()
  ctx.strokeStyle = 'rgba(95,69,48,0.18)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + width, y)
  ctx.stroke()
  ctx.restore()
}

// ============================================================
// 工具
// ============================================================

// cover 裁切计算（与 layoutEngine.computeCoverCrop 同语义，独立实现避免循环依赖）
function computeCoverCrop(img, slotW, slotH, focal = { x: 0.5, y: 0.5 }) {
  const srcW = img.naturalWidth || img.width
  const srcH = img.naturalHeight || img.height
  const scale = Math.max(slotW / srcW, slotH / srcH)
  const sw = slotW / scale
  const sh = slotH / scale
  const fx = clamp01(focal?.x ?? 0.5)
  const fy = clamp01(focal?.y ?? 0.5)
  const sx = clamp(srcW * fx - sw / 2, 0, Math.max(0, srcW - sw))
  const sy = clamp(srcH * fy - sh / 2, 0, Math.max(0, srcH - sh))
  return { sx, sy, sw, sh }
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max)
}

function clamp01(v) {
  return clamp(Number(v) || 0, 0, 1)
}

function loadImageSafe(src) {
  if (!src) return Promise.resolve(null)
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function formatToday() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

function defaultTokens() {
  return {
    warmBeige: primitive.color.warmBeige,
    creamWhite: primitive.color.creamWhite,
    coffeeBrown: primitive.color.coffeeBrown,
    textPrimary: semantic.textPrimary,
    textMuted: semantic.textMuted,
    decorativeLine: semantic.decorativeLine,
    softShadow: semantic.softShadow,
  }
}
