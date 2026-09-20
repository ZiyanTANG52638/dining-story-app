// AI 能力接口骨架 —— 为未来接入真实 AI 预留结构
//
// 设计原则：
//   - 当前原型无需真实 AI API 即可完整运行（全部有 mock 回退）
//   - 每个函数签名稳定，未来只需替换内部实现
//   - AI 只负责"选择 / 检测 / 推荐 / 生成短句"，最终视觉合成始终由模板确定性渲染
//
// 预留接口：
//   selectHeroImage(images)        选出 Hero 照片
//   detectFood(image)              检测食物主体
//   segmentSubject(image)          主体分割（抠图）
//   recommendTemplate(images)      推荐最佳模板
//   generateShortCaption(context)  生成短文案

import { TEMPLATES, DEFAULT_TEMPLATE_ID, SHORT_CAPTIONS } from './templates'

// 是否已接入真实 AI（当前为 false，走 mock 路径）
export const AI_ENABLED = false

/**
 * 选出 Hero 照片。
 * 规则：优先 role === 'hero'，否则取第一张有 src 的照片。
 * @param {Array} images 照片数组 [{ src, role, analysis }]
 * @returns {object|null}
 */
export async function selectHeroImage(images = []) {
  if (AI_ENABLED) {
    // TODO: 接入真实模型（如视觉显著性 / 清晰度 / 构图评分）
  }
  return (
    images.find((p) => p && p.role === 'hero' && p.src) ||
    images.find((p) => p && p.src) ||
    null
  )
}

/**
 * 检测食物主体。
 * 当前回退：使用拍照阶段已缓存的 analysis.detectedDishes。
 * @param {object} image 单张照片
 * @returns {Promise<{ hasFood: boolean, dishes: string[], confidence: number }>}
 */
export async function detectFood(image) {
  if (AI_ENABLED) {
    // TODO: 接入真实食物检测 API
  }
  const dishes = image?.analysis?.detectedDishes || []
  return {
    hasFood: dishes.length > 0,
    dishes,
    confidence: dishes.length > 0 ? 0.8 : 0.2,
  }
}

/**
 * 主体分割（抠图）。
 * 当前回退：返回原图（矩形），由 segmentSubject 工具统一处理。
 * @param {object} image 单张照片
 * @returns {Promise<{ src: string, isCutout: boolean }>}
 */
export async function segmentSubject(image) {
  if (AI_ENABLED) {
    // TODO: 接入真实分割 API，返回透明 PNG
  }
  return { src: image?.src || '', isCutout: false }
}

/**
 * 推荐最佳模板（基于照片分析的评分函数）。
 *
 * 评分逻辑：
 *   - 存在"孤立食物主体"（负空间高 + 明亮）→ Memory Collage 加分
 *   - 照片整体干净、留白多、构图简洁 → Editorial 加分
 *   - 其余情况 → Classic（最稳定兜底）
 *
 * @param {Array} images 照片数组（可含 analysis 字段）
 * @returns {Promise<string>} 模板 id
 */
export async function recommendTemplate(images = []) {
  if (AI_ENABLED) {
    // TODO: 接入真实推荐模型
  }

  const valid = (images || []).filter((p) => p && p.src)
  if (!valid.length) return DEFAULT_TEMPLATE_ID

  const hero = valid.find((p) => p.role === 'hero') || valid[0]
  const heroAnalysis = hero?.analysis || {}
  const hasFood = (heroAnalysis.detectedDishes || []).length > 0

  let collageScore = 0
  let editorialScore = 0

  // 孤立主体 → Memory Collage（有机遮罩 + 纸层拼贴）
  if (heroAnalysis.hasIsolatedSubject) collageScore += 2
  if (hasFood) collageScore += 1.5
  if ((heroAnalysis.negativeSpace || 0) > 0.3) collageScore += 1

  // 干净构图 / 留白 → Editorial
  const avgNegative =
    valid.reduce((s, p) => s + (p.analysis?.negativeSpace || 0), 0) / valid.length
  if (avgNegative > 0.25) editorialScore += 1.5
  if (valid.every((p) => (p.analysis?.orientation || 'square') !== 'landscape')) {
    editorialScore += 0.5
  }

  if (collageScore >= 2 && collageScore > editorialScore) return 'collage'
  if (editorialScore >= 1.5 && editorialScore > collageScore) return 'editorial'
  return 'classic'
}

/**
 * 生成短文案（克制，视觉主导）。
 * @param {object} context { companion, favoriteMoment, dishes }
 * @returns {Promise<string>}
 */
export async function generateShortCaption(context = {}) {
  if (AI_ENABLED) {
    // TODO: 接入真实文案生成
  }
  const { favoriteMoment } = context
  if (favoriteMoment && favoriteMoment.length <= 12) {
    return favoriteMoment
  }
  // 从短文案库中稳定挑选（基于照片数量，避免随机跳动）
  const idx = (context.dishes?.length || 0) % SHORT_CAPTIONS.length
  return SHORT_CAPTIONS[idx]
}

// 导出模板列表，方便 UI 直接消费
export { TEMPLATES }
