// 记忆卡模板定义 —— Sonho Kitchen 品牌化收藏卡
//
// 设计原则（确定性海报布局引擎 + 视觉令牌系统）：
//   - 每张 Story 都是一块固定设计画布（1080 × 1920），不随上传照片尺寸变化
//   - 每套模板定义固定 slots（坐标 + 尺寸 + 适配方式 + 焦点 + 遮罩）
//   - 上传照片只决定"裁切内容"，绝不改变 slot 尺寸
//   - 预览与导出共用同一份 layout config（单一数据源）
//   - 视觉差异来自：排版 / 令牌 / 遮罩 / 纸纹 / 图形细节，而非生成式 AI
//
// 三套模板（三种"记住今晚"的方式）：
//   01 Editorial      编辑手记 —— "我把今晚编辑成了一页杂志"
//   02 Memory Collage 晚餐手帖 —— "我把今晚贴进了手帖"
//   03 Classic        经典收藏 —— "我把今晚存成了一张好看的照片"
//
// 第四种模式（概念不同，非排版模板）：
//   04 Art Zine       艺术纸刊 —— "把今晚重新装订成一页"
//      · 01–03 是确定性排版模板：即时、稳定、可预测
//      · 04 是被编排的作品：更慢、更艺术、更独一无二
//      · 04 不参与确定性排版引擎，走独立的生成式流程（见 src/lib/artZine.js）

import { semantic, primitive, getTemplateTokens } from './designTokens'

export const CANVAS_W = 1080
export const CANVAS_H = 1920

// 兼容旧引用
export const BRAND = {
  beige: primitive.color.warmBeige,
  cream: primitive.color.creamWhite,
  coffee: primitive.color.coffeeBrown,
  coffeeSoft: primitive.color.coffeeSoft,
  coffeeLight: primitive.color.coffeeLight,
  sky: primitive.color.softSkyBlue,
  skyDeep: primitive.color.mutedBlue,
  bgTop: '#fbf7ef',
  bgBottom: '#efe4d0',
}

// ---- 文案长度硬限制（文字绝不改变布局尺寸）----
export const TEXT_LIMITS = {
  title: 8,
  subtitle: 20,
  memory: 16,
}

export const DEFAULT_FOCAL = { x: 0.5, y: 0.5 }

// ============================================================
// 模板布局配置
// ============================================================

export const TEMPLATES = [
  // ----------------------------------------------------------
  // 01 EDITORIAL 编辑手记 —— 杂志排版，大量留白，几乎无阴影
  // ----------------------------------------------------------
  {
    id: 'editorial',
    index: '01',
    name: 'Editorial',
    nameZh: '编辑手记',
    desc: '大字排版 · 杂志留白',
    caption: '今晚，值得记住。',
    tokens: getTemplateTokens('editorial'),
    background: { type: 'linear', from: '#fbf7ef', to: '#f3ead9' },
    // 编辑式大字（视觉骨架，位置固定）
    words: [
      { text: '今', x: 90, y: 300, size: 132 },
      { text: '晚', x: 90, y: 560, size: 132 },
      { text: '值得', x: 90, y: 820, size: 132 },
      { text: '记住', x: 90, y: 1080, size: 132 },
    ],
    // 固定照片窗口：Hero 中号 + 2 小号，尺寸恒定，不重叠
    slots: [
      { id: 'hero', role: 'hero', x: 620, y: 300, width: 370, height: 280, fit: 'cover', focalPoint: DEFAULT_FOCAL, shape: 'rect', radius: 4, shadow: false, mask: 'rectangle' },
      { id: 'support-1', role: 'support', x: 620, y: 620, width: 370, height: 240, fit: 'cover', focalPoint: DEFAULT_FOCAL, shape: 'rect', radius: 4, shadow: false, mask: 'rectangle' },
      { id: 'support-2', role: 'support', x: 620, y: 900, width: 370, height: 240, fit: 'cover', focalPoint: DEFAULT_FOCAL, shape: 'rect', radius: 4, shadow: false, mask: 'rectangle' },
    ],
    // 细天蓝线（编辑式分隔）
    lines: [
      { x: 90, y: 268, width: 200 },
      { x: 90, y: 1048, width: 200 },
    ],
    // 元数据（日期 / 地点）
    meta: { x: 90, y: 1420, size: 24, color: semantic.textMuted },
    textBlocks: [
      { id: 'caption', x: 90, y: 1500, maxWidth: 900, size: 38, lineHeight: 56, maxLines: 2, color: semantic.textSecondary, align: 'left', limit: TEXT_LIMITS.memory },
    ],
    decorative: { memoryNumber: true, stamp: true, stars: false, tape: false },
    paperTexture: 0.03,
  },

  // ----------------------------------------------------------
  // 02 MEMORY COLLAGE 晚餐手帖 —— 纸层 + 胶带 + 微旋转
  // ----------------------------------------------------------
  {
    id: 'collage',
    index: '02',
    name: 'Memory Collage',
    nameZh: '晚餐手帖',
    desc: '纸层拼贴 · 手帖温度',
    caption: '这一桌，很值得记住。',
    tokens: getTemplateTokens('collage'),
    background: { type: 'linear', from: '#f7f0e3', to: '#efe4d0' },
    // 纸层（最多两层）
    paperLayers: [
      { x: 70, y: 250, width: 940, height: 1180, radius: 26, fill: semantic.surfacePaper, rotate: -0.8, shadow: true },
      { x: 110, y: 300, width: 860, height: 1080, radius: 20, fill: semantic.surfacePaperAlt, rotate: 0.6, shadow: false },
    ],
    // Hero 大图（有机遮罩）+ 2 小图，微旋转
    slots: [
      { id: 'hero', role: 'hero', x: 150, y: 360, width: 780, height: 620, fit: 'cover', focalPoint: DEFAULT_FOCAL, shape: 'organic', radius: 0, shadow: true, mask: 'organic', rotate: -1.4 },
      { id: 'support-1', role: 'support', x: 130, y: 1030, width: 380, height: 300, fit: 'cover', focalPoint: DEFAULT_FOCAL, shape: 'rect', radius: 10, shadow: true, mask: 'rectangle', rotate: 1.8 },
      { id: 'support-2', role: 'support', x: 570, y: 1060, width: 380, height: 300, fit: 'cover', focalPoint: DEFAULT_FOCAL, shape: 'rect', radius: 10, shadow: true, mask: 'rectangle', rotate: -1.6 },
    ],
    // 胶带（最多 2 处，只在边角；旋转克制在 ±2° 内）
    tapes: [
      { x: 430, y: 330, width: 220, height: 54, rotate: -1.8, color: semantic.tapeCream, opacity: 0.62 },
      { x: 150, y: 990, width: 170, height: 46, rotate: 1.6, color: semantic.tapeSky, opacity: 0.5 },
    ],
    // 记忆编号位置（预览/导出共用）
    memoryNumber: { x: 90, y: 230 },
    // 手写风注释（文案与位置均由模板配置，预览/导出共用）
    annotation: { x: 150, y: 1520, size: 34, color: semantic.memoryAccent, rotate: -1.2, text: '今晚，值得记住' },
    // 日期印章
    stamp: { x: 700, y: 1560, size: 24, rotate: -1.5 },
    // 小星 / 点
    stars: [
      { x: 900, y: 420, size: 16 },
      { x: 200, y: 700, size: 11 },
      { x: 860, y: 1420, size: 13 },
    ],
    dots: [
      { x: 940, y: 900, size: 5 },
      { x: 160, y: 1420, size: 4 },
    ],
    lines: [{ x: 150, y: 1480, width: 180 }],
    textBlocks: [
      { id: 'caption', x: 540, y: 1700, maxWidth: 900, size: 40, lineHeight: 56, maxLines: 1, color: semantic.textPrimary, align: 'center', limit: TEXT_LIMITS.memory },
    ],
    decorative: { memoryNumber: true, stamp: true, stars: true, tape: true },
    paperTexture: 0.06,
  },

  // ----------------------------------------------------------
  // 03 CLASSIC 经典收藏 —— 最稳定，最少装饰，技术兜底
  // ----------------------------------------------------------
  {
    id: 'classic',
    index: '03',
    name: 'Classic',
    nameZh: '经典收藏',
    desc: '主角主导 · 温柔收藏',
    caption: '一张主角照片，两幕温柔瞬间。',
    tokens: getTemplateTokens('classic'),
    background: { type: 'linear', from: '#fbf7ef', to: '#efe4d0' },
    slots: [
      { id: 'hero', role: 'hero', x: 75, y: 240, width: 930, height: 1000, fit: 'cover', focalPoint: DEFAULT_FOCAL, shape: 'rect', radius: 28, shadow: true, mask: 'rectangle' },
      { id: 'support-1', role: 'support', x: 110, y: 1300, width: 400, height: 300, fit: 'cover', focalPoint: DEFAULT_FOCAL, shape: 'rect', radius: 22, shadow: true, mask: 'rectangle' },
      { id: 'support-2', role: 'support', x: 570, y: 1300, width: 400, height: 300, fit: 'cover', focalPoint: DEFAULT_FOCAL, shape: 'rect', radius: 22, shadow: true, mask: 'rectangle' },
    ],
    badge: { text: '今晚的主角', x: 115, y: 280, width: 200, height: 62, radius: 31, bg: semantic.brandAccent, color: semantic.surfacePaper },
    meta: { x: 540, y: 1660, size: 26, color: semantic.textMuted, align: 'center' },
    textBlocks: [
      { id: 'caption', x: 540, y: 1720, maxWidth: 900, size: 42, lineHeight: 58, maxLines: 1, color: semantic.textPrimary, align: 'center', limit: TEXT_LIMITS.memory },
    ],
    decorative: { memoryNumber: false, stamp: true, stars: false, tape: false },
    paperTexture: 0.02,
  },
]

export const DEFAULT_TEMPLATE_ID = 'editorial'

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0]
}

// 短文案库（避免长段落；视觉保持主导）
export const SHORT_CAPTIONS = [
  '今晚的主角',
  '这一桌，很值得记住。',
  '慢一点吃，这一晚还很长。',
  '和喜欢的人，认真吃一顿饭。',
  '一张主角照片，两幕温柔瞬间。',
]

// 编辑式大字排版词（Editorial 模板的视觉骨架）
export const EDITORIAL_WORDS = ['今', '晚', '值得', '记住']

// 模板切换器的展示顺序
export const TEMPLATE_ORDER = TEMPLATES.map((t) => t.id)

// ============================================================
// 04 ART ZINE 艺术纸刊 —— 非排版模板，独立的生成式模式
// ============================================================
//
// 概念上与前三种不同：
//   · 01–03 是「设计好的」模板（designed）
//   · 04   是「被编排的」作品（authored）
//
// 因此它不进入 TEMPLATES（确定性排版引擎），
// 而是作为选择器中的第四张卡片，触发独立的 Art Zine 流程。
export const ART_ZINE_ID = 'art-zine'

export const ART_ZINE_CARD = {
  id: ART_ZINE_ID,
  index: '04',
  name: 'Art Zine',
  nameZh: '艺术纸刊',
  desc: '重新装订 · 独一无二',
  caption: '把今晚重新装订成一页。',
  sparkle: true, // 选择器上显示细微闪光图标
  generative: true, // 标记：非确定性模板，走生成式流程
}

// 选择器展示列表：三张确定性模板卡 + 一张 Art Zine 卡
export const SELECTOR_CARDS = [...TEMPLATES, ART_ZINE_CARD]

// 判断某个 id 是否为 Art Zine 模式
export function isArtZine(id) {
  return id === ART_ZINE_ID
}
