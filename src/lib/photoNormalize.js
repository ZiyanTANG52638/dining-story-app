// 照片归一化 —— 渲染任何模板前，先把照片转成统一的可复用对象
//
// 设计原则：
//   - 三套模板共用同一份归一化数据，避免每个模板各自 resize 源图导致不一致
//   - 只计算元数据（比例 / 方向 / 焦点 / 主色），不重绘、不修改照片内容
//   - 无 AI 时用轻量像素统计兜底；未来可替换为真实模型
//
// 输出结构：
//   {
//     id, src, role,
//     width, height,
//     aspectRatio, orientation,
//     focalPoint: { x, y },
//     dominantColor: { r, g, b },
//     brightness, negativeSpace,
//   }

import { analyzePhoto, detectFocalPoint } from './photoAnalysis'

/**
 * 归一化单张照片。
 * @param {object} photo { src, role, id }
 * @param {number} index
 * @returns {Promise<object>}
 */
export async function normalizePhoto(photo, index = 0) {
  if (!photo?.src) {
    return emptyNormalized(photo, index)
  }

  const analysis = await analyzePhoto(photo.src)
  const focalPoint = photo.focalPoint || detectFocalPoint(analysis)

  return {
    id: photo.id || `photo-${index}`,
    src: photo.src,
    role: photo.role || (index === 0 ? 'hero' : 'support'),
    width: analysis.width,
    height: analysis.height,
    aspectRatio: analysis.aspectRatio,
    orientation: analysis.orientation,
    focalPoint,
    dominantColor: analysis.dominantColor,
    brightness: analysis.brightness,
    negativeSpace: analysis.negativeSpace,
    hasIsolatedSubject: analysis.hasIsolatedSubject,
  }
}

/**
 * 批量归一化照片（保持顺序）。
 * @param {Array} photos
 * @returns {Promise<Array>}
 */
export async function normalizePhotos(photos = []) {
  const out = []
  for (let i = 0; i < photos.length; i += 1) {
    out.push(await normalizePhoto(photos[i], i))
  }
  return out
}

/**
 * 从归一化照片中选出 Hero 与支持照片。
 * @param {Array} normalized
 * @returns {{ hero: object|null, supports: Array }}
 */
export function splitHeroAndSupports(normalized = []) {
  const valid = normalized.filter((p) => p && p.src)
  const hero = valid.find((p) => p.role === 'hero') || valid[0] || null
  const supports = valid.filter((p) => p !== hero)
  return { hero, supports }
}

function emptyNormalized(photo, index) {
  return {
    id: photo?.id || `photo-${index}`,
    src: '',
    role: photo?.role || (index === 0 ? 'hero' : 'support'),
    width: 0,
    height: 0,
    aspectRatio: 1,
    orientation: 'square',
    focalPoint: { x: 0.5, y: 0.5 },
    dominantColor: { r: 200, g: 180, b: 150 },
    brightness: 0.5,
    negativeSpace: 0.2,
    hasIsolatedSubject: false,
  }
}
