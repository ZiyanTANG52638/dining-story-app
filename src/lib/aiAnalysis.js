// AI 图片分析模块（原型版）
//
// 架构说明：
//   真实场景中，这里会调用云端视觉 API（如 GPT-4V / Gemini / 自建模型），
//   返回结构化的分析结果。原型阶段我们：
//     1. 用 Canvas 在本地做真实的低层分析（亮度、清晰度、构图、整洁度估算）
//     2. 将分析结果映射为"正向建议"文案 —— 绝不拒绝照片、绝不展示负面评分
//
// 设计原则：
//   - 永远不出现"模糊/太暗/不合格"等负面措辞
//   - 只提供"可以让它更出彩"的积极引导
//   - 每条建议都附带一个可执行的增强动作

// 把图片加载到 Image 对象
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// 将图片绘制到小尺寸 canvas 并读取像素数据
async function readPixels(src, size = 96) {
  const img = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, size, size)
  return ctx.getImageData(0, 0, size, size)
}

// 计算平均亮度 (0-255)
function averageBrightness(data) {
  let sum = 0
  const n = data.length / 4
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }
  return sum / n
}

// 用拉普拉斯方差估算清晰度（值越高越清晰）
function sharpnessScore(data, w, h) {
  const gray = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      gray[y * w + x] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    }
  }
  let sum = 0
  let sumSq = 0
  let count = 0
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x
      const lap =
        4 * gray[idx] -
        gray[idx - 1] -
        gray[idx + 1] -
        gray[idx - w] -
        gray[idx + w]
      sum += lap
      sumSq += lap * lap
      count++
    }
  }
  const variance = sumSq / count - (sum / count) * (sum / count)
  return Math.sqrt(Math.max(variance, 0))
}

// 估算画面"主体居中"程度：中心区域与边缘的亮度/饱和度差异
function compositionScore(data, w, h) {
  const cx = Math.floor(w / 2)
  const cy = Math.floor(h / 2)
  const innerR = Math.min(w, h) * 0.28
  const outerR = Math.min(w, h) * 0.5
  let innerSat = 0
  let innerN = 0
  let outerSat = 0
  let outerN = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const sat = max === 0 ? 0 : (max - min) / max
      const dist = Math.hypot(x - cx, y - cy)
      if (dist < innerR) {
        innerSat += sat
        innerN++
      } else if (dist > outerR) {
        outerSat += sat
        outerN++
      }
    }
  }
  const inner = innerN ? innerSat / innerN : 0
  const outer = outerN ? outerSat / outerN : 0
  // 主体越突出（中心比边缘更饱和），构图越"聚焦"
  return Math.min(1, Math.max(0, 0.5 + (inner - outer) * 2))
}

// 估算画面整洁度：色彩方差越低通常越干净统一
function cleanlinessScore(data) {
  let sum = 0
  let sumSq = 0
  let n = 0
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    sum += lum
    sumSq += lum * lum
    n++
  }
  const variance = sumSq / n - (sum / n) * (sum / n)
  // 方差小 -> 画面干净统一
  return Math.min(1, Math.max(0, 1 - variance / 900))
}

// 根据照片章节 + 分析结果，生成正向建议与增强参数
function buildSuggestions(stepId, metrics) {
  const { brightness, sharpness, composition, cleanliness } = metrics
  const suggestions = []
  const enhance = { brightness: 0, contrast: 0, saturation: 0, sharpen: 0, warmth: 0 }

  // 亮度建议
  if (brightness < 95) {
    suggestions.push('这个瞬间很有氛围。稍微提亮一点，能让食物与细节更清晰动人。')
    enhance.brightness = 18
    enhance.warmth = 6
  } else if (brightness > 200) {
    suggestions.push('画面明亮通透。微微降低曝光，能让色彩更沉稳高级。')
    enhance.brightness = -12
  } else {
    suggestions.push('光线恰到好处，温暖又自然。')
  }

  // 清晰度建议
  if (sharpness < 14) {
    suggestions.push('这一刻的情绪很珍贵。轻轻增强锐化，能让轮廓更利落。')
    enhance.sharpen = 0.4
    enhance.contrast = 6
  } else {
    suggestions.push('细节清晰锐利，质感十足。')
  }

  // 构图建议
  if (composition < 0.45) {
    suggestions.push('把主角再往画面中央带一点，故事会更聚焦。')
    enhance.contrast += 8
    enhance.saturation += 6
  } else {
    suggestions.push('主体突出，构图很有张力。')
  }

  // 整洁度建议
  if (cleanliness < 0.5) {
    suggestions.push('画面很有生活气息。稍作柔和处理，能让整体更干净耐看。')
    enhance.saturation += 4
  } else {
    suggestions.push('画面干净利落，赏心悦目。')
  }

  // 章节专属的"氛围滤镜"建议
  const stepFlavor = {
    'first-impression': {
      label: '暖调氛围滤镜',
      enhance: { warmth: 10, saturation: 4, contrast: 4 },
      note: '为环境添一层暖光，氛围感更足。',
    },
    'signature-moment': {
      label: '美食高光滤镜',
      enhance: { saturation: 10, contrast: 8, warmth: 4, brightness: 4 },
      note: '让菜品的色泽与光泽更诱人。',
    },
    'memory-moment': {
      label: '温柔回忆滤镜',
      enhance: { warmth: 8, brightness: 6, saturation: 2 },
      note: '柔和的色调，让回忆更温暖。',
    },
  }[stepId]

  if (stepFlavor) {
    suggestions.push(`已为你搭配「${stepFlavor.label}」，${stepFlavor.note}`)
    enhance.brightness += stepFlavor.enhance.brightness || 0
    enhance.contrast += stepFlavor.enhance.contrast || 0
    enhance.saturation += stepFlavor.enhance.saturation || 0
    enhance.warmth += stepFlavor.enhance.warmth || 0
  }

  // 汇总成一句"开场肯定"
  const opener = pickOpener(stepId)

  return {
    opener,
    suggestions,
    metrics: {
      brightness: Math.round(brightness),
      sharpness: Math.round(sharpness),
      composition: Math.round(composition * 100),
      cleanliness: Math.round(cleanliness * 100),
    },
    enhance,
  }
}

function pickOpener(stepId) {
  const openers = {
    'first-impression': [
      '很棒的第一印象，氛围已经被你捕捉到了。',
      '这个环境拍得很有味道。',
      '你已经把餐厅的气质收进画面了。',
    ],
    'signature-moment': [
      '这道菜看起来就很有故事。',
      '招牌时刻被你稳稳拿捏。',
      '食物的光泽感已经出来了。',
    ],
    'memory-moment': [
      '这一刻的相聚，值得被好好记住。',
      '画面里都是温度。',
      '你们的故事，正在被温柔记录。',
    ],
  }
  const list = openers[stepId] || ['这个瞬间被你抓住了。']
  return list[Math.floor(Math.random() * list.length)]
}

// 主入口：分析一张照片，返回正向建议 + 增强参数
export async function analyzePhoto(src, stepId) {
  // 模拟网络延迟，让"AI 分析中"的体验更真实
  await sleep(900 + Math.random() * 700)

  try {
    const { data, width, height } = await readPixels(src)
    const brightness = averageBrightness(data)
    const sharpness = sharpnessScore(data, width, height)
    const composition = compositionScore(data, width, height)
    const cleanliness = cleanlinessScore(data)

    const result = buildSuggestions(stepId, {
      brightness,
      sharpness,
      composition,
      cleanliness,
    })

    // 附加"识别到的菜品"占位（真实场景由视觉模型返回）
    result.detectedDishes = detectDishes(stepId)

    return result
  } catch {
    // 分析失败也绝不阻断流程，返回温和的默认建议
    return {
      opener: '这个瞬间已经被你好好记下了。',
      suggestions: ['已为你自动优化光线与色彩，让画面更出彩。'],
      metrics: { brightness: 128, sharpness: 30, composition: 60, cleanliness: 70 },
      enhance: { brightness: 8, contrast: 6, saturation: 6, sharpen: 0.2, warmth: 6 },
      detectedDishes: detectDishes(stepId),
    }
  }
}

// 模拟菜品识别（真实场景由视觉模型返回）
function detectDishes(stepId) {
  const pool = {
    'first-impression': ['前菜拼盘', '时令沙拉'],
    'signature-moment': ['招牌慢炖牛肋排', '松露奶油意面', '炙烤海鲈鱼', '黑松露披萨'],
    'memory-moment': ['手作提拉米苏', '餐后甜点'],
  }
  const list = pool[stepId] || []
  const count = 1 + Math.floor(Math.random() * Math.min(2, list.length))
  const shuffled = [...list].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
