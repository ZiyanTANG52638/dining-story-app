// Art Zine 文案库 —— 记忆导向、克制、无技术术语
//
// 原则：
//   - 绝不出现 AI / model / processing / API 等技术词
//   - 主短句 ≤ 12 个中文字符
//   - 语气平静、手作、有温度

// 过渡屏三句文案（依次出现，营造「重新装订」的节奏）
export const ART_ZINE_STEPS = [
  '正在重新整理今晚的三个瞬间…',
  '寻找画面里的主角、光线与留白',
  '把它们装订成一页',
]

// Art Zine 主短句库（≤ 12 字）
export const ART_ZINE_PHRASES = [
  '今晚，值得记住。',
  '这一桌，慢慢吃完。',
  '留住今晚的光。',
  '把今晚装订成一页。',
  '这一晚，慢慢回味。',
]

// 主短句硬上限（中文字符数）
export const ART_ZINE_PHRASE_LIMIT = 12

// 模板选择器底部说明（不提及 AI）
export const TEMPLATE_SELECTOR_NOTE =
  '前三种即时生成，艺术纸刊会重新编排今晚的三个瞬间。'

// 兜底文案（生成失败时，绝不留下空白）
export const ART_ZINE_FALLBACK = {
  message: '这一页暂时没能装订好',
  action: '先保存为经典收藏',
}

// 随机取一句主短句（避免每次相同）
export function pickArtZinePhrase(seed = Date.now()) {
  const idx = Math.abs(Math.floor(seed)) % ART_ZINE_PHRASES.length
  return ART_ZINE_PHRASES[idx]
}

// 按长度裁剪主短句（绝不改变布局）
export function clampArtZinePhrase(text = '') {
  const chars = Array.from(String(text))
  if (chars.length <= ART_ZINE_PHRASE_LIMIT) return text
  return chars.slice(0, ART_ZINE_PHRASE_LIMIT).join('')
}
