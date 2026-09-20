// 主体分割工具 —— 抠出主角菜（原型版）
//
// 当前策略（无真实分割 API）：
//   1. 若提供 mock 透明 PNG（image.cutoutSrc），直接使用
//   2. 否则回退为原始矩形照片（isCutout = false）
//
// 未来接入真实 API 时，只需替换 segmentSubject() 内部实现，
// 返回 { src, isCutout: true } 即可，调用方无需改动。

import { AI_ENABLED } from './aiModules'

/**
 * 对单张图片做主体分割。
 * @param {object} image 照片对象 { src, cutoutSrc?, analysis? }
 * @returns {Promise<{ src: string, isCutout: boolean }>}
 */
export async function segmentSubject(image) {
  if (!image?.src) return { src: '', isCutout: false }

  // 1) 已有 mock 透明 PNG（未来真实 API 也走这条路径）
  if (image.cutoutSrc) {
    return { src: image.cutoutSrc, isCutout: true }
  }

  // 2) 真实 API 预留位
  if (AI_ENABLED) {
    // TODO: 调用真实分割 API，返回透明 PNG dataURL
    // const cutout = await callSegmentationApi(image.src)
    // return { src: cutout, isCutout: true }
  }

  // 3) 回退：原始矩形照片
  return { src: image.src, isCutout: false }
}

/**
 * 批量分割（用于 Hero + 支持照片）。
 * @param {Array} images
 * @returns {Promise<Array<{ src: string, isCutout: boolean }>>}
 */
export async function segmentSubjects(images = []) {
  return Promise.all(images.map((img) => segmentSubject(img)))
}
