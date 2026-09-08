// Instagram Story 导出模块 —— 用 Canvas 合成 9:16 竖版"记忆收藏卡"
//
// 输出尺寸：1080 x 1920（Instagram Story 标准）
// 构图：Hero-first（Hero 占 60-70% 视觉空间）+ 大量留白 + 暖色手作
//   - 顶部：餐厅品牌 + 日期（编辑杂志式）
//   - 中间：Hero 大图（主导）+ 两张 Memory Snapshots 小卡（支持而非竞争）
//   - 底部：暖色可收藏叙事卡
// 色彩：暖米色背景 / 咖啡棕文字 / 柔和天蓝点缀（避免纯黑）

import { RESTAURANT } from '../data/photos'

const W = 1080
const H = 1920

// Sonho Kitchen 暖色品牌色
const BG_TOP = '#fbf7ef'
const BG_BOTTOM = '#efe4d0'
const COFFEE = '#5f4530'
const COFFEE_SOFT = '#96704f'
const COFFEE_LIGHT = '#b08a6a'
const SKY = '#9fc3d4'
const CARD = '#fffdf8'

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// 圆角矩形路径
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// 在圆角区域内绘制图片（cover 裁剪）
function drawCover(ctx, img, x, y, w, h, r) {
  roundRect(ctx, x, y, w, h, r)
  ctx.save()
  ctx.clip()
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
  ctx.restore()
}

// 绘制带旋转的漂浮照片卡（柔和暖色阴影）
function drawFloatingCard(ctx, img, cx, cy, w, h, r, angle) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate((angle * Math.PI) / 180)
  // 柔和阴影（暖色，非深黑）
  ctx.shadowColor = 'rgba(90,60,35,0.35)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 16
  drawCover(ctx, img, -w / 2, -h / 2, w, h, r)
  ctx.restore()
}

// 选出 Hero 照片（role === 'hero' 优先）
function pickHero(photos) {
  return photos.find((p) => p && p.role === 'hero') || photos[0] || null
}

// 主导出函数
export async function exportStoryImage({ photos, story, companionEmoji, momentEmoji }) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // ---- 背景：暖米色渐变（避免纯黑） ----
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, BG_TOP)
  bg.addColorStop(1, BG_BOTTOM)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // 柔和天蓝细线（品牌点缀）
  ctx.strokeStyle = 'rgba(159,195,212,0.6)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(90, 150)
  ctx.lineTo(990, 150)
  ctx.stroke()

  // ---- 顶部：餐厅品牌 + 日期（编辑杂志式，大量留白） ----
  ctx.textAlign = 'center'
  ctx.fillStyle = COFFEE
  ctx.font = '600 40px "PingFang SC", "Noto Sans SC", sans-serif'
  ctx.fillText(RESTAURANT.name, W / 2, 120)

  ctx.fillStyle = COFFEE_SOFT
  ctx.font = '500 20px "PingFang SC", "Noto Sans SC", sans-serif'
  ctx.fillText(RESTAURANT.englishName, W / 2, 158)

  ctx.fillStyle = COFFEE_SOFT
  ctx.font = '400 28px "PingFang SC", "Noto Sans SC", sans-serif'
  ctx.fillText(story.date, W / 2, 205)

  // ---- 中间：Hero-first 照片编排 ----
  const hero = pickHero(photos)
  const snapshots = photos.filter((p) => p && p !== hero).slice(0, 2)
  const imgs = {}
  if (hero) imgs.hero = await loadImage(hero.src)
  for (let i = 0; i < snapshots.length; i++) {
    imgs[`s${i}`] = await loadImage(snapshots[i].src)
  }

  // Hero 大图：占主导（约 62% 高度），居中，轻微旋转
  const heroTop = 230
  const heroW = W - 150
  const heroH = 980
  const heroCx = W / 2
  const heroCy = heroTop + heroH / 2
  if (imgs.hero) drawFloatingCard(ctx, imgs.hero, heroCx, heroCy, heroW, heroH, 26, -1.2)

  // Hero 标签（柔和天蓝）
  if (imgs.hero) {
    ctx.save()
    ctx.translate(heroCx, heroTop + 60)
    ctx.rotate((-1.2 * Math.PI) / 180)
    ctx.fillStyle = SKY
    roundRect(ctx, -95, -30, 190, 60, 30)
    ctx.fill()
    ctx.fillStyle = '#fbf7ef'
    ctx.font = '600 26px "PingFang SC", "Noto Sans SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('今晚的主角', 0, 8)
    ctx.restore()
  }

  // 两张 Memory Snapshots 小卡：错落叠放在 Hero 下方两侧（支持而非竞争）
  const snapTop = heroCy + heroH / 2 - 70
  if (imgs.s0) {
    drawFloatingCard(ctx, imgs.s0, W / 2 - 150, snapTop + 40, 240, 300, 20, 3)
  }
  if (imgs.s1) {
    drawFloatingCard(ctx, imgs.s1, W / 2 + 150, snapTop + 10, 240, 300, 20, -3)
  }

  // ---- 底部：暖色可收藏叙事卡（明信片物件感） ----
  const cardTop = 1500
  const cardH = H - cardTop - 70
  const cardX = 70
  const cardW = W - 140

  // 卡片背景（暖白，柔和投影）
  ctx.save()
  ctx.shadowColor = 'rgba(90,60,35,0.25)'
  ctx.shadowBlur = 50
  ctx.shadowOffsetY = 20
  roundRect(ctx, cardX, cardTop, cardW, cardH, 30)
  ctx.fillStyle = CARD
  ctx.fill()
  ctx.restore()
  ctx.strokeStyle = 'rgba(122,90,62,0.2)'
  ctx.lineWidth = 2
  roundRect(ctx, cardX, cardTop, cardW, cardH, 30)
  ctx.stroke()

  // 柔和天蓝细线（卡片顶部点缀）
  ctx.strokeStyle = 'rgba(159,195,212,0.7)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(cardX + 50, cardTop + 60)
  ctx.lineTo(cardX + 170, cardTop + 60)
  ctx.stroke()

  // 情感化标题（独特，随瞬间变化）
  ctx.textAlign = 'left'
  ctx.fillStyle = COFFEE
  ctx.font = '600 56px "PingFang SC", "Noto Sans SC", sans-serif'
  ctx.fillText(story.headline || '值得记住的一晚', cardX + 50, cardTop + 150)

  // 陪伴 + 时刻（emoji 行）
  ctx.font = '400 30px "PingFang SC", "Noto Sans SC", sans-serif'
  ctx.fillStyle = COFFEE_SOFT
  const metaLine = `${companionEmoji} ${story.companion}    ${momentEmoji} ${story.favoriteMoment}`
  ctx.fillText(metaLine, cardX + 50, cardTop + 215)

  // 叙事正文（自动换行）
  ctx.fillStyle = COFFEE
  ctx.font = '400 34px "PingFang SC", "Noto Sans SC", sans-serif'
  const maxWidth = cardW - 100
  const lineHeight = 54
  let y = cardTop + 300
  const words = story.body.split('')
  let line = ''
  for (const ch of words) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, cardX + 50, y)
      line = ch
      y += lineHeight
    } else {
      line = test
    }
  }
  ctx.fillText(line, cardX + 50, y)

  // 底部：照片数量 + 品牌口号
  ctx.fillStyle = COFFEE_LIGHT
  ctx.font = '400 26px "PingFang SC", "Noto Sans SC", sans-serif'
  ctx.fillText(`📷 珍藏 ${story.photoCount} 个瞬间`, cardX + 50, cardTop + cardH - 45)

  ctx.textAlign = 'right'
  ctx.fillStyle = COFFEE_LIGHT
  ctx.fillText(RESTAURANT.tagline, cardX + cardW - 50, cardTop + cardH - 45)

  // ---- 顶部/底部柔和暖色暗角（非深黑） ----
  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75)
  vignette.addColorStop(0, 'rgba(122,90,62,0)')
  vignette.addColorStop(1, 'rgba(122,90,62,0.12)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, W, H)

  return canvas.toDataURL('image/jpeg', 0.95)
}
