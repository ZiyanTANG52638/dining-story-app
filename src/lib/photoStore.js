// 照片存储 —— 统一照片对象结构 + 会话级持久化
//
// 数据流（新）：
//   Camera / File input
//     → Photo objects { id, url, type, timestamp }
//     → ArtZineGenerator
//
// 设计原则：
//   - 照片对象结构统一，渲染器只消费 { url, type, focalPoint }，不关心来源
//   - 会话级持久化（sessionStorage），刷新不丢失；不写入 localStorage（隐私）
//   - 绝不把照片上传到任何第三方（当前阶段纯本地）

// 照片角色类型（与拍摄章节一一对应）
export const PHOTO_TYPE = {
  SPACE: 'space', // 空间氛围 → spatial anchor
  DISH: 'dish', // 招牌主角 → visual protagonist
  MEMORY: 'memory', // 记忆瞬间 → emotional fragment
}

// 拍摄章节 id → 照片类型
const STEP_TO_TYPE = {
  'first-impression': PHOTO_TYPE.SPACE,
  'signature-moment': PHOTO_TYPE.DISH,
  'memory-moment': PHOTO_TYPE.MEMORY,
}

const STORAGE_KEY = 'sonho.photos.v1'

/**
 * 创建一个统一结构的照片对象。
 *
 * @param {object} opts
 * @param {string} opts.url       图片地址（dataURL / blobURL / 静态路径）
 * @param {string} opts.type      PHOTO_TYPE 之一
 * @param {object} opts.focalPoint 焦点 { x, y }（0~1），可选
 * @param {object} opts.extra     额外字段（analysis / stepId 等），可选
 * @returns {{ id, url, type, timestamp, focalPoint }}
 */
export function createPhoto({ url, type = PHOTO_TYPE.SPACE, focalPoint = null, extra = {} } = {}) {
  return {
    id: `photo-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    url: url || '',
    type,
    timestamp: Date.now(),
    focalPoint: focalPoint || { x: 0.5, y: 0.5 },
    ...extra,
  }
}

/**
 * 把拍摄章节结果转成统一照片对象。
 * 兼容旧结构（{ src, role, stepId, analysis }）。
 */
export function fromCaptureStep(step, src, analysis = null) {
  const type = STEP_TO_TYPE[step?.id] || PHOTO_TYPE.SPACE
  return createPhoto({
    url: src,
    type,
    focalPoint: analysis?.focalPoint || null,
    extra: {
      stepId: step?.id || null,
      role: step?.role || null,
      analysis: analysis || null,
      // 兼容字段：渲染器/旧模块可能读取 src
      src,
    },
  })
}

/**
 * 按类型取出照片（Art Zine 渲染器使用）。
 * @returns {{ heroPhoto, supportPhoto1, supportPhoto2 }}
 */
export function splitByType(photos = []) {
  const list = (photos || []).filter((p) => p && (p.url || p.src))
  const pick = (type) => list.find((p) => p.type === type) || null

  const dish = pick(PHOTO_TYPE.DISH)
  const space = pick(PHOTO_TYPE.SPACE)
  const memory = pick(PHOTO_TYPE.MEMORY)

  // 缺图时优雅降级：按顺序补齐，保证渲染器始终拿到可用照片
  const fallback = list.filter((p) => p !== dish && p !== space && p !== memory)

  return {
    heroPhoto: dish || space || fallback[0] || list[0] || null,
    supportPhoto1: space || fallback[0] || list[0] || null,
    supportPhoto2: memory || fallback[1] || fallback[0] || list[1] || null,
  }
}

// ---- 会话级持久化（刷新不丢失，关闭标签页即清除）----

export function savePhotos(photos = []) {
  try {
    // 只持久化必要字段，避免 sessionStorage 超限
    const slim = photos.map((p) => ({
      id: p.id,
      url: p.url || p.src || '',
      type: p.type,
      timestamp: p.timestamp,
      focalPoint: p.focalPoint,
    }))
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(slim))
  } catch {
    // 存储失败（超限 / 隐私模式）不影响主流程
  }
}

export function loadPhotos() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function clearPhotos() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // 忽略
  }
}
