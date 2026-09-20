// 共享布局引擎 —— 预览（DOM）与导出（Canvas）共用的确定性计算
//
// 设计原则：
//   - 单一数据源：模板 slots 配置 → 本引擎计算 → 预览 / 导出各自渲染
//   - 照片只决定"裁切内容"，绝不改变 slot 尺寸
//   - cover 裁切 + focalPoint（焦点）支持
//   - 文本严格限长，超长只截断，绝不推动布局
//
// 本文件不依赖 DOM / Canvas，纯计算，可被两端安全引用。

import { DEFAULT_FOCAL, TEXT_LIMITS } from './templates'

// ---- 文本工具 ----

/**
 * 按中文字符数截断文本（超出补省略号）。
 * 文字长度绝不改变布局尺寸，只做截断。
 * @param {string} text
 * @param {number} limit 最大字符数
 * @returns {string}
 */
export function clampText(text, limit) {
  const str = String(text || '').trim()
  if (!limit || str.length <= limit) return str
  return str.slice(0, Math.max(1, limit - 1)) + '…'
}

/**
 * 按语义类型限长。
 * @param {string} text
 * @param {'title'|'subtitle'|'memory'} kind
 */
export function clampByKind(text, kind) {
  const limit = TEXT_LIMITS[kind] || TEXT_LIMITS.memory
  return clampText(text, limit)
}

// ---- 图片裁切计算 ----

/**
 * 计算 cover 裁切参数：填满 slot 且不变形。
 * 返回源图上的裁切矩形（sx, sy, sw, sh），供 Canvas drawImage 使用。
 *
 * @param {number} srcW 源图宽
 * @param {number} srcH 源图高
 * @param {number} slotW slot 宽
 * @param {number} slotH slot 高
 * @param {{x:number,y:number}} [focal] 焦点（0–1 归一化，默认居中）
 * @returns {{sx:number, sy:number, sw:number, sh:number}}
 */
export function computeCoverCrop(srcW, srcH, slotW, slotH, focal = DEFAULT_FOCAL) {
  if (!srcW || !srcH || !slotW || !slotH) {
    return { sx: 0, sy: 0, sw: srcW || 0, sh: srcH || 0 }
  }
  const slotRatio = slotW / slotH
  const srcRatio = srcW / srcH

  let sw
  let sh
  if (srcRatio > slotRatio) {
    // 源图更宽 → 以高度为准，裁切左右
    sh = srcH
    sw = srcH * slotRatio
  } else {
    // 源图更高 → 以宽度为准，裁切上下
    sw = srcW
    sh = srcW / slotRatio
  }

  const fx = clamp01(focal?.x ?? DEFAULT_FOCAL.x)
  const fy = clamp01(focal?.y ?? DEFAULT_FOCAL.y)

  // 焦点决定裁切窗口位置（居中时 fx=0.5）
  let sx = (srcW - sw) * fx
  let sy = (srcH - sh) * fy
  sx = clamp(sx, 0, Math.max(0, srcW - sw))
  sy = clamp(sy, 0, Math.max(0, srcH - sh))

  return { sx, sy, sw, sh }
}

/**
 * 计算 contain 适配参数：完整显示且不变形（仅用于抠图主体）。
 * 返回目标绘制矩形（dx, dy, dw, dh）。
 */
export function computeContainFit(srcW, srcH, slotW, slotH) {
  if (!srcW || !srcH || !slotW || !slotH) {
    return { dx: 0, dy: 0, dw: slotW || 0, dh: slotH || 0 }
  }
  const scale = Math.min(slotW / srcW, slotH / srcH)
  const dw = srcW * scale
  const dh = srcH * scale
  return {
    dx: (slotW - dw) / 2,
    dy: (slotH - dh) / 2,
    dw,
    dh,
  }
}

// ---- 照片 → slot 分配 ----

/**
 * 将照片数组按角色分配到模板 slots。
 * 规则：hero slot 取 role==='hero' 的照片（否则第一张）；
 *       support slots 依次取剩余照片。
 * 返回 Map<slotId, photo|null>，保证每个 slot 都有确定结果。
 *
 * @param {Array} slots 模板 slots
 * @param {Array} photos 照片数组 [{ src, role, focalPoint }]
 * @returns {Object<string, object|null>}
 */
export function assignPhotosToSlots(slots = [], photos = []) {
  const valid = (photos || []).filter((p) => p && p.src)
  const heroPhoto =
    valid.find((p) => p.role === 'hero') || valid[0] || null
  const supportPhotos = valid.filter((p) => p !== heroPhoto)

  const map = {}
  let supportIdx = 0
  for (const slot of slots) {
    if (slot.role === 'hero') {
      map[slot.id] = heroPhoto
    } else {
      map[slot.id] = supportPhotos[supportIdx] || null
      supportIdx += 1
    }
  }
  return map
}

/**
 * 解析 slot 的最终焦点：优先照片自带 focalPoint，否则用 slot 默认。
 */
export function resolveFocal(slot, photo) {
  return photo?.focalPoint || slot?.focalPoint || DEFAULT_FOCAL
}

// ---- 数值工具 ----

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max)
}

function clamp01(v) {
  return clamp(Number(v) || 0, 0, 1)
}

// ---- 预览缩放 ----

/**
 * 计算预览缩放比例：整块画布等比缩放到容器宽度。
 * 预览容器必须保持精确 9:16。
 * @param {number} containerWidth 容器宽度（px）
 * @param {number} canvasWidth 逻辑画布宽（默认 1080）
 */
export function computePreviewScale(containerWidth, canvasWidth = 1080) {
  if (!containerWidth || !canvasWidth) return 0
  return containerWidth / canvasWidth
}
