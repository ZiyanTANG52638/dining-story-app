// 设计令牌系统 —— 三层架构（Primitive → Semantic → Template）
//
// 设计原则：
//   - 所有视觉决策集中在此，模板只消费令牌，不硬编码颜色/间距
//   - 三套模板共享同一品牌系统，但各自拥有独立视觉身份
//   - 预览（DOM）与导出（Canvas）共用同一份令牌，保证一致
//
// 三层：
//   1. Primitive  原始值（颜色 / 间距 / 圆角 / 字号）
//   2. Semantic   语义映射（背景 / 纸面 / 文字 / 强调 / 阴影）
//   3. Template   模板专属（排版尺度 / 图形密度 / 遮罩 / 装饰）

// ============================================================
// 1. PRIMITIVE TOKENS —— 原始值
// ============================================================

export const primitive = {
  color: {
    warmBeige: '#f7f0e3',
    creamWhite: '#fffdf8',
    coffeeBrown: '#5f4530',
    coffeeSoft: '#96704f',
    coffeeLight: '#b08a6a',
    softSkyBlue: '#9fc3d4',
    mutedBlue: '#7fa9bd',
    paperShadow: 'rgba(90,60,35,0.18)',
    paperShadowDeep: 'rgba(90,60,35,0.28)',
    ink: '#3d2c1e',
    tapeCream: 'rgba(255,250,238,0.62)',
    tapeSky: 'rgba(159,195,212,0.52)',
  },
  space: {
    xs: 12,
    sm: 24,
    md: 48,
    lg: 90,
    xl: 140,
  },
  radius: {
    small: 12,
    medium: 22,
    large: 34,
    pill: 999,
  },
  font: {
    display: 132,
    h1: 72,
    h2: 48,
    body: 40,
    caption: 30,
    micro: 22,
  },
}

// ============================================================
// 2. SEMANTIC TOKENS —— 语义映射
// ============================================================

export const semantic = {
  backgroundPrimary: primitive.color.warmBeige,
  surfacePaper: primitive.color.creamWhite,
  surfacePaperAlt: '#fbf6ec',
  textPrimary: primitive.color.coffeeBrown,
  textSecondary: primitive.color.coffeeSoft,
  textMuted: primitive.color.coffeeLight,
  brandAccent: primitive.color.softSkyBlue,
  brandAccentDeep: primitive.color.mutedBlue,
  memoryAccent: primitive.color.coffeeSoft,
  decorativeLine: 'rgba(159,195,212,0.75)',
  softShadow: primitive.color.paperShadow,
  softShadowDeep: primitive.color.paperShadowDeep,
  ink: primitive.color.ink,
  tapeCream: primitive.color.tapeCream,
  tapeSky: primitive.color.tapeSky,
}

// ============================================================
// 3. TEMPLATE TOKENS —— 模板专属
// ============================================================

// 01 Editorial 编辑手记 —— 杂志排版，大量留白，几乎无阴影
export const editorialTokens = {
  typography: {
    display: 132,
    displayWeight: 700,
    displayTracking: 0,
    meta: 24,
    metaWeight: 400,
    caption: 38,
    captionWeight: 400,
    lineHeight: 1.5,
  },
  spacing: {
    margin: 90,
    rhythm: 260,
    photoGap: 40,
  },
  graphicDensity: 'low',
  photoMask: 'rectangle',
  shadow: 'none',
  paperTexture: 0.03,
  decorative: {
    lines: true,
    tape: false,
    stamp: true,
    stars: false,
    memoryNumber: true,
  },
  rotation: 0,
}

// 02 Memory Collage 晚餐手帖 —— 拼贴手帖，纸层 + 胶带 + 微旋转
export const collageTokens = {
  typography: {
    display: 96,
    displayWeight: 700,
    meta: 26,
    metaWeight: 400,
    caption: 40,
    captionWeight: 500,
    annotation: 34,
    annotationWeight: 400,
    lineHeight: 1.4,
  },
  spacing: {
    margin: 80,
    rhythm: 200,
    photoGap: 36,
  },
  graphicDensity: 'medium',
  photoMask: 'organic',
  shadow: 'soft',
  paperTexture: 0.06,
  decorative: {
    lines: true,
    tape: true,
    stamp: true,
    stars: true,
    memoryNumber: true,
  },
  rotation: 1.6,
  tapeMax: 2,
}

// 03 Classic 经典收藏 —— 最稳定，最少装饰
export const classicTokens = {
  typography: {
    display: 64,
    displayWeight: 600,
    meta: 26,
    metaWeight: 400,
    caption: 42,
    captionWeight: 500,
    lineHeight: 1.4,
  },
  spacing: {
    margin: 75,
    rhythm: 180,
    photoGap: 60,
  },
  graphicDensity: 'minimal',
  photoMask: 'rectangle',
  shadow: 'soft',
  paperTexture: 0.02,
  decorative: {
    lines: true,
    tape: false,
    stamp: true,
    stars: false,
    memoryNumber: false,
  },
  rotation: 0,
}

// 模板 id → 令牌映射
export const TEMPLATE_TOKENS = {
  editorial: editorialTokens,
  collage: collageTokens,
  classic: classicTokens,
}

export function getTemplateTokens(id) {
  return TEMPLATE_TOKENS[id] || editorialTokens
}

// 兼容旧引用（BRAND 语义）
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
