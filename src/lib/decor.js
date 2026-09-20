// 装饰组件绘制库（Canvas 导出端）—— 可复用的矢量装饰元素
//
// 设计原则：
//   - 全部用 Canvas 矢量绘制，不用栅格 PNG，保证导出清晰一致
//   - 与预览端 StoryDecor.jsx 视觉参数一一对应（同一份令牌）
//   - 轻量：胶带最多 2 处，纸纹极低透明度，不干扰文字可读性
//
// 组件：
//   drawTape()          半透明胶带（暖奶油 / 柔天蓝，微噪点，边缘略不齐）
//   drawPaperLayer()    纸层（圆角矩形 + 柔和阴影）
//   drawDateStamp()     日期印章
//   drawMemoryNumber()  记忆编号（No. 01）
//   drawHandDrawnLine() 手绘线
//   drawSmallStar()     小星 / 点
//   drawPaperTexture()  极低透明度纸纹
//   renderHeroMask()    Hero 遮罩（rectangle / circle / organic）
//   maskPath()          遮罩路径（供 clip 使用）

import { semantic, primitive } from './designTokens'

// ---- 基础路径工具 ----

export function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

export function circlePath(ctx, cx, cy, r) {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.closePath()
}

// 有机 blob 控制点（归一化，-1 ~ 1）—— 预览与导出共用的唯一几何来源
export const ORGANIC_POINTS = [
  [0.0, -1.0], [0.62, -0.86], [1.0, -0.18], [0.94, 0.5],
  [0.42, 1.0], [-0.34, 0.96], [-1.0, 0.36], [-0.9, -0.44],
]

// 有机 blob 路径（确定性，基于固定控制点，非随机）
// 用二次贝塞尔平滑连接 8 个控制点，得到柔和有机轮廓（非多边形）
export function organicPath(ctx, x, y, w, h) {
  const cx = x + w / 2
  const cy = y + h / 2
  const rx = w / 2
  const ry = h / 2
  const pts = ORGANIC_POINTS
  const P = pts.map(([px, py]) => [cx + px * rx, cy + py * ry])
  ctx.beginPath()
  // 起点取首尾中点，保证闭合平滑
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const start = mid(P[P.length - 1], P[0])
  ctx.moveTo(start[0], start[1])
  for (let i = 0; i < P.length; i += 1) {
    const cur = P[i]
    const next = P[(i + 1) % P.length]
    const m = mid(cur, next)
    ctx.quadraticCurveTo(cur[0], cur[1], m[0], m[1])
  }
  ctx.closePath()
}

/**
 * 遮罩路径 —— 供 clip 使用。
 * @param {'rectangle'|'circle'|'organic'} type
 */
export function maskPath(ctx, type, x, y, w, h, radius = 0) {
  if (type === 'circle') {
    circlePath(ctx, x + w / 2, y + h / 2, Math.min(w, h) / 2)
  } else if (type === 'organic') {
    organicPath(ctx, x, y, w, h)
  } else {
    roundRectPath(ctx, x, y, w, h, radius)
  }
}

/**
 * Hero 遮罩渲染架构 —— 未来可替换为真实主体分割。
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} img
 * @param {object} slot { x, y, width, height, radius }
 * @param {'rectangle'|'circle'|'organic'} type
 * @param {{sx,sy,sw,sh}} crop cover 裁切参数
 */
export function renderHeroMask(ctx, img, slot, type, crop) {
  const { x, y, width, height, radius = 0 } = slot
  ctx.save()
  maskPath(ctx, type, x, y, width, height, radius)
  ctx.clip()
  if (crop) {
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, x, y, width, height)
  } else {
    ctx.drawImage(img, x, y, width, height)
  }
  ctx.restore()
}

// ---- 纸层 ----

export function drawPaperLayer(ctx, x, y, w, h, radius, { fill = semantic.surfacePaper, shadow = true, rotate = 0 } = {}) {
  ctx.save()
  if (rotate) {
    ctx.translate(x + w / 2, y + h / 2)
    ctx.rotate((rotate * Math.PI) / 180)
    ctx.translate(-(x + w / 2), -(y + h / 2))
  }
  if (shadow) {
    ctx.shadowColor = semantic.softShadow
    ctx.shadowBlur = 34
    ctx.shadowOffsetY = 12
  }
  roundRectPath(ctx, x, y, w, h, radius)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.restore()
}

// ---- 胶带 ----

/**
 * 半透明胶带（暖奶油 / 柔天蓝），微噪点，边缘略不齐。
 * @param {object} opts { x, y, width, height, rotate, color, opacity }
 */
export function drawTape(ctx, { x, y, width, height, rotate = 0, color = semantic.tapeCream, opacity = 0.6 } = {}) {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.translate(x + width / 2, y + height / 2)
  ctx.rotate((rotate * Math.PI) / 180)

  const w = width
  const h = height
  const hw = w / 2
  const hh = h / 2

  // 略不齐的边缘（确定性锯齿）
  ctx.beginPath()
  ctx.moveTo(-hw, -hh + 2)
  ctx.lineTo(-hw + 6, -hh - 1)
  ctx.lineTo(hw - 8, -hh + 1)
  ctx.lineTo(hw, -hh + 3)
  ctx.lineTo(hw - 4, hh - 2)
  ctx.lineTo(hw - 10, hh + 1)
  ctx.lineTo(-hw + 7, hh - 1)
  ctx.lineTo(-hw, hh - 3)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()

  // 微噪点纹理（确定性点阵，低透明度）
  ctx.globalAlpha = opacity * 0.28
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 26; i += 1) {
    const px = -hw + ((i * 37) % Math.max(1, w))
    const py = -hh + ((i * 53) % Math.max(1, h))
    ctx.fillRect(px, py, 2, 2)
  }
  ctx.restore()
}

// ---- 日期印章 ----

export function drawDateStamp(
  ctx,
  { x, y, text, size = 24, color = semantic.textMuted, rotate = 0, align = 'left' } = {},
) {
  ctx.save()
  ctx.translate(x, y)
  if (rotate) ctx.rotate((rotate * Math.PI) / 180)
  ctx.font = `500 ${size}px "PingFang SC", "Noto Sans SC", sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = align === 'center' ? 'center' : 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 0, 0)
  ctx.restore()
}

// ---- 记忆编号 ----

export function drawMemoryNumber(ctx, { x, y, number = '01', size = 26, color = semantic.brandAccentDeep } = {}) {
  ctx.save()
  ctx.font = `600 ${size}px "PingFang SC", "Noto Sans SC", sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(`No. ${number}`, x, y)
  ctx.restore()
}

// ---- 手绘线 ----

export function drawHandDrawnLine(ctx, { x, y, width, color = semantic.decorativeLine, thickness = 4 } = {}) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = thickness
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x, y)
  // 轻微起伏，模拟手绘
  ctx.quadraticCurveTo(x + width * 0.5, y - 3, x + width, y + 1)
  ctx.stroke()
  ctx.restore()
}

// ---- 小星 / 点 ----

export function drawSmallStar(ctx, { x, y, size = 14, color = semantic.brandAccent, opacity = 0.8 } = {}) {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = color
  const spikes = 4
  const outer = size
  const inner = size * 0.34
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner
    const a = (Math.PI / spikes) * i - Math.PI / 2
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export function drawDot(ctx, { x, y, size = 6, color = semantic.brandAccent, opacity = 0.7 } = {}) {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = color
  circlePath(ctx, x, y, size)
  ctx.fill()
  ctx.restore()
}

// ---- 纸纹 ----

/**
 * 极低透明度纸纹（确定性点阵，不干扰文字）。
 * @param {number} opacity 建议 0.02–0.06
 */
export function drawPaperTexture(ctx, W, H, opacity = 0.04) {
  if (!opacity) return
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = primitive.color.coffeeBrown
  const step = 7
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      // 确定性伪随机（基于坐标）
      const n = (x * 73856093) ^ (y * 19349663)
      if ((n & 7) === 0) {
        ctx.fillRect(x, y, 1.4, 1.4)
      }
    }
  }
  ctx.restore()
}
