// 照片分析模块 —— 构图前先"读懂"照片，再决定裁切与模板
//
// 设计原则：
//   - 只分析，不重绘、不修改照片内容
//   - 输出结构化指标，供 recommendTemplate / detectFocalPoint 使用
//   - 无 AI 时用轻量 Canvas 像素统计（亮度 / 负空间 / 视觉重心）兜底
//   - 未来可替换为真实模型，函数签名保持不变
//
// 分析维度：
//   orientation      方向（portrait / landscape / square）
//   aspectRatio      宽高比
//   brightness       平均亮度（0–1）
//   negativeSpace    负空间比例（0–1，越高越"干净"）
//   visualWeight     视觉重心 { x, y }（0–1）
//   dominantColor    主色 { r, g, b }
//   hasIsolatedSubject 是否存在孤立主体（用于 Cutout 推荐）

import { AI_ENABLED } from './aiModules'

const ANALYSIS_SIZE = 64

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function readPixels(src, size = ANALYSIS_SIZE) {
  return loadImage(src).then((img) => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, size, size)
    const { data } = ctx.getImageData(0, 0, size, size)
    return { data, size, width: img.width, height: img.height }
  })
}

function orientationOf(w, h) {
  const ratio = w / h
  if (ratio > 1.15) return 'landscape'
  if (ratio < 0.87) return 'portrait'
  return 'square'
}

/**
 * 分析单张照片。
 * @param {string} src 图片地址
 * @returns {Promise<object>} 分析结果
 */
export async function analyzePhoto(src) {
  if (!src) return fallbackAnalysis()

  if (AI_ENABLED) {
    // TODO: 接入真实视觉分析模型
  }

  try {
    const { data, size, width, height } = await readPixels(src)
    const total = size * size

    let sumLum = 0
    let sumR = 0
    let sumG = 0
    let sumB = 0
    let brightCount = 0
    let wx = 0
    let wy = 0
    let wSum = 0

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      sumLum += lum
      sumR += r
      sumG += g
      sumB += b
      if (lum > 0.82) brightCount += 1

      // 视觉重心：以"与均值的偏离度"为权重（主体通常更饱和/更暗）
      const px = (i / 4) % size
      const py = Math.floor(i / 4 / size)
      const weight = Math.abs(lum - 0.5) + 0.05
      wx += px * weight
      wy += py * weight
      wSum += weight
    }

    const brightness = sumLum / total
    const negativeSpace = brightCount / total
    const visualWeight = {
      x: wSum ? wx / wSum / size : 0.5,
      y: wSum ? wy / wSum / size : 0.5,
    }
    const dominantColor = {
      r: Math.round(sumR / total),
      g: Math.round(sumG / total),
      b: Math.round(sumB / total),
    }

    return {
      orientation: orientationOf(width, height),
      aspectRatio: width / height,
      brightness,
      negativeSpace,
      visualWeight,
      dominantColor,
      hasIsolatedSubject: negativeSpace > 0.28 && brightness > 0.5,
      width,
      height,
    }
  } catch {
    return fallbackAnalysis()
  }
}

/**
 * 批量分析照片。
 * @param {Array} photos [{ src, role }]
 * @returns {Promise<Array>} 每张照片附带 analysis
 */
export async function analyzePhotos(photos = []) {
  const results = []
  for (const p of photos) {
    if (!p || !p.src) {
      results.push({ ...p, analysis: fallbackAnalysis() })
      continue
    }
    const analysis = await analyzePhoto(p.src)
    results.push({ ...p, analysis })
  }
  return results
}

/**
 * 检测焦点（裁切中心）。
 * 当前：使用视觉重心；未来 AI 可返回 { x: 0.55, y: 0.42 }。
 * @param {object} analysis analyzePhoto 的结果
 * @returns {{x:number,y:number}}
 */
export function detectFocalPoint(analysis) {
  if (AI_ENABLED) {
    // TODO: 接入真实焦点检测（食物主体 / 人脸 / 桌面中心 / 最亮区域）
  }
  const vw = analysis?.visualWeight
  if (!vw) return { x: 0.5, y: 0.5 }
  // 轻微收敛到中心，避免极端裁切
  return {
    x: clamp(vw.x * 0.6 + 0.5 * 0.4, 0.2, 0.8),
    y: clamp(vw.y * 0.6 + 0.5 * 0.4, 0.2, 0.8),
  }
}

function fallbackAnalysis() {
  return {
    orientation: 'square',
    aspectRatio: 1,
    brightness: 0.5,
    negativeSpace: 0.2,
    visualWeight: { x: 0.5, y: 0.5 },
    dominantColor: { r: 200, g: 180, b: 150 },
    hasIsolatedSubject: false,
    width: 0,
    height: 0,
  }
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max)
}
