// Art Zine 艺术纸刊 —— 生成式视觉体验
//
// 与 01–03 模板的本质区别：
//   01–03 是「确定性排版模板」——即时、稳定、可预测
//   04   是「被编排的作品」——更慢、更艺术、更独一无二
//
// 当前阶段（真实照片管线）：
//   - 不再使用静态 demo 图
//   - 用用户自己拍摄的三张照片，在本地 Canvas 真实渲染 1080×1920 成品
//   - 不调用任何 AI 图像生成 API
//
// 未来服务端架构（已预留）：
//   Frontend
//     → POST /api/generate-art-zine
//     → serverless backend
//     → visual generation service
//     → 返回最终图片 URL
//   若服务端不可用，自动回退到本地渲染器（renderArtZine）。
//
// 安全约束：
//   - 绝不在前端代码中放置 API Key
//   - 绝不在浏览器内直接运行 agent skills
//   - 前端只负责「发起请求 + 展示结果」

import { semantic, primitive } from './designTokens'
import { renderArtZine } from './artZineRender'
import { splitByType } from './photoStore'

// 是否启用真实生成服务（未来置为 true 并接入后端）
export const ART_ZINE_API_ENABLED = false

// 未来后端端点（当前不调用）
export const ART_ZINE_ENDPOINT = '/api/generate-art-zine'

// 品牌令牌快照 —— 传给渲染器 / 未来生成服务，保证作品属于 Sonho Kitchen
export function buildBrandTokens() {
  return {
    warmBeige: primitive.color.warmBeige,
    creamWhite: primitive.color.creamWhite,
    coffeeBrown: primitive.color.coffeeBrown,
    coffeeSoft: primitive.color.coffeeSoft,
    softSkyBlue: primitive.color.softSkyBlue,
    mutedBlue: primitive.color.mutedBlue,
    ink: primitive.color.ink,
    textPrimary: semantic.textPrimary,
    textSecondary: semantic.textSecondary,
    textMuted: semantic.textMuted,
    brandAccent: semantic.brandAccent,
    memoryAccent: semantic.memoryAccent,
    decorativeLine: semantic.decorativeLine,
    softShadow: semantic.softShadow,
  }
}

/**
 * 生成 Art Zine 作品。
 *
 * 当前实现：用用户真实照片在本地 Canvas 渲染成品图。
 * 未来只需把 ART_ZINE_API_ENABLED 置为 true 并接入后端，调用方无需改动。
 *
 * @param {object}   opts
 * @param {Array}    opts.photos       照片数组（统一结构 { url, type, focalPoint }）
 * @param {object}   opts.restaurant   餐厅信息 { name, englishName, location }
 * @param {string}   opts.memoryText   记忆短句（≤12 字）
 * @param {object}   opts.brandTokens  品牌令牌（默认 buildBrandTokens()）
 * @returns {Promise<{ url: string, source: 'api'|'local', meta: object }>}
 */
export async function generateArtZine({
  photos = [],
  restaurant = {},
  memoryText = '',
  brandTokens = null,
} = {}) {
  const tokens = brandTokens || buildBrandTokens()

  // 按角色拆分三张照片（空间锚点 / 视觉主角 / 情感碎片）
  const { heroPhoto, supportPhoto1, supportPhoto2 } = splitByType(photos)

  // ---- 真实 API 预留位（当前不执行）----
  if (ART_ZINE_API_ENABLED) {
    try {
      const res = await fetch(ART_ZINE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: photos.map((p) => ({ url: p.url || p.src, type: p.type, focalPoint: p.focalPoint })),
          restaurant,
          memoryText,
          brandTokens: tokens,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.url) {
          return { url: data.url, source: 'api', meta: data.meta || {} }
        }
      }
      // 服务端失败 → 落到本地渲染兜底（绝不留下空白）
    } catch {
      // 网络异常 → 落到本地渲染兜底
    }
  }

  // ---- 本地真实渲染：用户照片 → 1080×1920 成品图 ----
  await simulateComposeDelay()

  const result = await renderArtZine({
    heroPhoto,
    supportPhoto1,
    supportPhoto2,
    memoryText,
    restaurantInfo: restaurant,
    brandTokens: tokens,
  })

  return {
    url: result.url,
    source: result.source, // 'local'
    meta: {
      ...result.meta,
      roles: {
        hero: heroPhoto?.url || heroPhoto?.src || null,
        support1: supportPhoto1?.url || supportPhoto1?.src || null,
        support2: supportPhoto2?.url || supportPhoto2?.src || null,
      },
      memoryText,
      restaurant: restaurant?.name || '',
    },
  }
}

/**
 * 按内容逻辑给三张照片分配角色（保留兼容 API）。
 *   空间氛围 → spatial anchor（空间锚点）
 *   招牌主角 → visual protagonist（视觉主角）
 *   记忆瞬间 → emotional fragment（情感碎片）
 */
export function classifyPhotoRoles(photos = []) {
  const { heroPhoto, supportPhoto1, supportPhoto2 } = splitByType(photos)
  return {
    atmosphere: supportPhoto1?.url || supportPhoto1?.src || null,
    hero: heroPhoto?.url || heroPhoto?.src || null,
    memory: supportPhoto2?.url || supportPhoto2?.src || null,
  }
}

// 模拟「重新装订」的编排耗时（保持平静节奏，避免闪屏）
function simulateComposeDelay(ms = 1400) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
