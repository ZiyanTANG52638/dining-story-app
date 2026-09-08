// 视觉工具库 —— 为"Sonho Kitchen 暖色手作"界面提供动态色彩与模糊背景
//
// 能力：
//   1. extractPalette(src)   —— 从一张照片中提取主色（用于动态氛围背景）
//   2. makeBlurredBg(src)    —— 生成一张高斯模糊的照片背景（暖色提亮）
//   3. buildMemoryTheme(src) —— 综合提取一套主题色（主色/深色/浅色/强调色）
//
// 全部基于 Canvas 本地实现，无需额外依赖。
// 设计取向：暖米色/咖啡棕/柔和天蓝，浅色留白，避免纯黑。

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// 将图片绘制到小尺寸画布并读取像素
async function readPixels(src, size = 64) {
  const img = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, size, size)
  return { data: ctx.getImageData(0, 0, size, size).data, img }
}

// 把 RGB 转成 HSL
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h /= 6
  }
  return { h: h * 360, s, l }
}

function hslToRgb(h, s, l) {
  h /= 360
  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

// 对像素做色彩量化，找出占主导的"色相族"
function dominantHue(data) {
  const buckets = new Array(12).fill(0)
  let total = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const { h, s, l } = rgbToHsl(r, g, b)
    if (s > 0.12 && l > 0.12 && l < 0.92) {
      const idx = Math.min(11, Math.floor((h / 360) * 12))
      buckets[idx]++
      total++
    }
  }
  if (total === 0) return 32 // 默认暖咖啡
  let best = 0
  for (let i = 1; i < 12; i++) {
    if (buckets[i] > buckets[best]) best = i
  }
  return (best / 12) * 360 + 15
}

// 从照片提取一套"记忆主题色" —— 暖色浅调（Sonho Kitchen）
export async function buildMemoryTheme(src) {
  try {
    const { data, img } = await readPixels(src, 48)
    const hue = dominantHue(data)

    // 基于主导色相生成和谐色板，但整体偏暖、偏浅、留白
    const theme = {
      hue,
      primary: hslToCss(hue, 0.4, 0.42), // 主色（咖啡棕系，用于强调/文字）
      deep: hslToCss(hue, 0.28, 0.3), // 深色（用于文字/深强调）
      mid: hslToCss(hue, 0.3, 0.9), // 中间过渡（暖米背景）
      glow: hslToCss(hue, 0.35, 0.82), // 高光（柔和暖光）
      soft: hslToCss(hue, 0.2, 0.96), // 浅色（页面底）
      accent: hslToCss(200, 0.35, 0.72), // 强调（柔和天蓝，品牌点缀）
      imgW: img.width,
      imgH: img.height,
    }
    return theme
  } catch {
    // 失败时回退到暖米/咖啡/天蓝
    return fallbackTheme()
  }
}

function hslToCss(h, s, l) {
  const [r, g, b] = hslToRgb(h, s, l)
  return `rgb(${r},${g},${b})`
}

function fallbackTheme() {
  return {
    hue: 32,
    primary: 'rgb(122,90,62)',
    deep: 'rgb(74,53,38)',
    mid: 'rgb(247,240,227)',
    glow: 'rgb(214,191,156)',
    soft: 'rgb(251,247,239)',
    accent: 'rgb(159,195,212)',
    imgW: 900,
    imgH: 1200,
  }
}

// 生成一张高斯模糊的照片背景（暖色提亮，非压暗）
// 输出为 dataURL，可直接作为 CSS background-image
export async function makeBlurredBg(src, blur = 40, dim = 0.18) {
  try {
    const { img } = await readPixels(src, 160)
    const canvas = document.createElement('canvas')
    const scale = 0.35 // 缩小以加速模糊
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    ctx.filter = `blur(${blur}px) brightness(${1 + dim * 0.3}) saturate(1.05)`
    ctx.drawImage(canvas, 0, 0)
    // 叠一层很浅的暖米色，保证前景文字可读（浅色玻璃）
    ctx.fillStyle = `rgba(247,240,227,${dim})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.85)
  } catch {
    return null
  }
}

// 便捷：给定若干照片 src，取第一张可用的作为"氛围主图"
export function pickHero(photos) {
  return photos.find((p) => p && p.src)?.src || null
}
