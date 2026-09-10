// AI 图片增强模块 —— 基于 Canvas API 的本地图像处理
//
// 真实场景中，增强可由云端模型完成；原型阶段我们用 Canvas 实现：
//   - 亮度 / 对比度 / 饱和度 / 色温（暖调）调整
//   - 锐化（卷积核）
//   - 输出为适合分享的 JPEG dataURL

const MAX_DIMENSION = 1600 // 控制导出尺寸，避免内存过大

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// 将增强参数应用到一张图片，返回增强后的 dataURL
export async function enhanceImage(src, params = {}) {
  const {
    brightness = 0, // -100..100
    contrast = 0, // -100..100
    saturation = 0, // -100..100
    warmth = 0, // -100..100 (暖调)
    sharpen = 0, // 0..1
  } = params

  const img = await loadImage(src)

  // 计算缩放后的画布尺寸
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)

  // 先做像素级色彩调整
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data

  // 计算亮度/对比度查找表
  const b = brightness / 100
  const c = contrast / 100
  const factor = (259 * (c + 255)) / (255 * (259 - c))
  const lut = new Uint8ClampedArray(256)
  for (let i = 0; i < 256; i++) {
    let v = factor * (i - 128) + 128 + b * 255
    lut[i] = Math.max(0, Math.min(255, v))
  }

  // 饱和度
  const s = 1 + saturation / 100
  // 暖调：增强红、减弱蓝
  const warmR = warmth > 0 ? 1 + warmth / 300 : 1
  const warmB = warmth > 0 ? 1 - warmth / 400 : 1

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let bv = data[i + 2]

    // 饱和度
    if (s !== 1) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * bv
      r = gray + (r - gray) * s
      g = gray + (g - gray) * s
      bv = gray + (bv - gray) * s
    }

    // 暖调
    r *= warmR
    bv *= warmB

    // 亮度/对比度 LUT
    data[i] = lut[Math.max(0, Math.min(255, Math.round(r)))]
    data[i + 1] = lut[Math.max(0, Math.min(255, Math.round(g)))]
    data[i + 2] = lut[Math.max(0, Math.min(255, Math.round(bv)))]
  }
  ctx.putImageData(imageData, 0, 0)

  // 锐化（可选）
  if (sharpen > 0) {
    applySharpen(ctx, w, h, sharpen)
  }

  // 输出为高质量 JPEG
  return canvas.toDataURL('image/jpeg', 0.92)
}

// 拉普拉斯锐化
function applySharpen(ctx, w, h, amount) {
  const src = ctx.getImageData(0, 0, w, h)
  const srcData = src.data
  const out = ctx.createImageData(w, h)
  const outData = out.data
  const strength = amount * 1.2

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const i = (y * w + x) * 4 + c
        const center = srcData[i]
        const up = srcData[i - w * 4]
        const down = srcData[i + w * 4]
        const left = srcData[i - 4]
        const right = srcData[i + 4]
        const laplacian = 4 * center - up - down - left - right
        outData[i] = center + strength * laplacian
      }
      outData[(y * w + x) * 4 + 3] = 255
    }
  }
  // 边缘像素直接复制
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        const i = (y * w + x) * 4
        outData[i] = srcData[i]
        outData[i + 1] = srcData[i + 1]
        outData[i + 2] = srcData[i + 2]
        outData[i + 3] = 255
      }
    }
  }
  ctx.putImageData(out, 0, 0)
}

// 生成一张纯色/渐变占位图（用于无相机环境下的演示照片）
export function createDemoPhoto(stepId) {
  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = 1200
  const ctx = canvas.getContext('2d')

  const palettes = {
    'first-impression': ['#2a211c', '#4a3a2c', '#c9a06a'],
    'signature-moment': ['#3a2118', '#7a3b2a', '#e0a05a'],
    'memory-moment': ['#2c1f2a', '#5a3a4a', '#d9a0a0'],
  }
  const [dark, mid, light] = palettes[stepId] || palettes['signature-moment']

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  grad.addColorStop(0, dark)
  grad.addColorStop(0.6, mid)
  grad.addColorStop(1, light)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 画一个抽象的"餐盘"圆
  ctx.beginPath()
  ctx.arc(canvas.width / 2, canvas.height * 0.45, 220, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(246,239,230,0.92)'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(canvas.width / 2, canvas.height * 0.45, 150, 0, Math.PI * 2)
  ctx.fillStyle = light
  ctx.fill()

  // 高光
  ctx.beginPath()
  ctx.arc(canvas.width / 2 - 40, canvas.height * 0.45 - 50, 60, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fill()

  return canvas.toDataURL('image/jpeg', 0.9)
}
