// 静态资源 URL 工具 —— 兼容 Vite base（GitHub Pages 子路径部署）
//
// 问题：直接写 "/6.png" 会被浏览器解析为站点根路径，
//       在 base = '/dining-story-app/' 时变成 https://host/6.png → 404。
// 解决：用 import.meta.env.BASE_URL 拼接，得到
//       https://host/dining-story-app/images/6.png → 200。
//
// 所有 public/ 下的餐厅照片统一通过 assetUrl() 引用。

const BASE = import.meta.env.BASE_URL || '/'

/**
 * 生成 public/ 静态资源的稳定 URL。
 * @param {string} path 相对 public/ 的路径，如 'images/6.png'
 * @returns {string} 带 base 前缀的绝对路径
 */
export function assetUrl(path) {
  const clean = String(path).replace(/^\/+/, '')
  return `${BASE}${clean}`
}

// 餐厅照片（public/images/）
export const PHOTOS = {
  atmosphere: assetUrl('images/1.png'), // 氛围 · 空间
  heroDish: assetUrl('images/2.png'), // 主角菜
  together: assetUrl('images/3.png'), // 记忆 · 同行
  tableStory: assetUrl('images/4.png'), // 桌边故事
  brandDetail: assetUrl('images/5.png'), // 品牌细节
  environment: assetUrl('images/6.png'), // 餐厅环境（Landing hero）
}
