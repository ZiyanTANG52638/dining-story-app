// Instagram Story 导出模块 —— 委托给模板渲染引擎
//
// 输出尺寸：1080 x 1920（Instagram Story 标准）
// 三套模板：editorial / collage / classic（见 src/lib/templates.js）
//
// 本模块保留原有导出函数签名（向后兼容），内部改为调用 renderTemplate()，
// 并支持传入 templateId 与 caption 选择不同模板。

import { renderTemplate } from './renderTemplate'
import { DEFAULT_TEMPLATE_ID } from './templates'
import { segmentSubject } from './segmentSubject'

/**
 * 导出记忆卡为 dataURL。
 * @param {object} opts
 * @param {Array}  opts.photos        照片数组
 * @param {object} opts.story         故事对象
 * @param {string} opts.templateId    模板 id（默认 editorial）
 * @param {string} opts.caption       短文案
 * @param {string} opts.companionEmoji 兼容旧签名（当前模板未使用）
 * @param {string} opts.momentEmoji    兼容旧签名（当前模板未使用）
 * @returns {Promise<string>} JPEG dataURL
 */
export async function exportStoryImage({
  photos = [],
  story = {},
  templateId = DEFAULT_TEMPLATE_ID,
  caption = '',
  // 兼容旧调用签名
  companionEmoji,
  momentEmoji,
}) {
  // Memory Collage 模板需要主角抠图；无真实 API 时回退为原图
  let heroCutout = null
  if (templateId === 'collage') {
    const heroPhoto =
      photos.find((p) => p && p.role === 'hero' && p.src) ||
      photos.find((p) => p && p.src) ||
      null
    if (heroPhoto) {
      heroCutout = await segmentSubject(heroPhoto)
    }
  }

  return renderTemplate({
    templateId,
    photos,
    story,
    caption,
    heroCutout,
  })
}
