// 三张照片的引导定义 —— 用"故事章节"而非"任务"来引导用户
//
// Sonho Kitchen 构图原则：1 张 Hero（主角）+ 2 张支持照片（Memory Snapshots）
//   - 不鼓励等权构图
//   - 第二张"招牌时刻"是 Hero，占据视觉主导
//   - 第一、三张是氛围与陪伴的支持镜头

export const PHOTO_STEPS = [
  {
    id: 'first-impression',
    role: 'snapshot', // 支持照片：环境氛围
    chapter: '氛围',
    title: '先记住这里',
    subtitle: '环境 · 光 · 气息',
    prompt: '轻轻环顾四周，拍下让你放松下来的那一角',
    tips: [
      '找一个安静的角度，让画面留出呼吸',
      '捕捉暖光、木桌与杯盘的气息',
      '不用太满，留白让氛围更耐看',
    ],
    icon: 'sparkle',
  },
  {
    id: 'signature-moment',
    role: 'hero', // Hero：招牌主角
    chapter: '主角',
    title: '这一道，是今晚的主角',
    subtitle: '招牌 · 主菜',
    prompt: '把这道菜拍成整晚的 Hero 镜头',
    tips: [
      '让主菜占据画面大半，成为唯一主角',
      '靠近一些，让热气与光泽清晰可见',
      '侧光下拍摄，食物会更立体诱人',
    ],
    icon: 'dish',
  },
  {
    id: 'memory-moment',
    role: 'snapshot', // 支持照片：相聚陪伴
    chapter: '陪伴',
    title: '还有身边的人',
    subtitle: '相聚 · 举杯',
    prompt: '把这一刻的笑容与碰杯轻轻收进画面',
    tips: [
      '抓拍自然的互动瞬间',
      '让餐桌与朋友一起入镜',
      '举起杯子，让故事更有温度',
    ],
    icon: 'heart',
  },
]

export const PHOTO_STEP_INDEX = Object.fromEntries(
  PHOTO_STEPS.map((s, i) => [s.id, i]),
)

// 陪伴对象选项
export const COMPANION_OPTIONS = [
  { id: 'friends', label: '朋友', emoji: '👯' },
  { id: 'family', label: '家人', emoji: '👨‍👩‍👧' },
  { id: 'date', label: '约会', emoji: '💞' },
  { id: 'colleagues', label: '同事', emoji: '🤝' },
  { id: 'solo', label: '独享时光', emoji: '🌿' },
]

// 最难忘瞬间选项
export const FAVORITE_MOMENT_OPTIONS = [
  { id: 'first-bite', label: '第一口惊艳', emoji: '😋' },
  { id: 'toast', label: '举杯相庆', emoji: '🥂' },
  { id: 'laugh', label: '开怀大笑', emoji: '😂' },
  { id: 'ambience', label: '氛围感拉满', emoji: '🕯️' },
  { id: 'dessert', label: '甜品收尾', emoji: '🍰' },
  { id: 'surprise', label: '意外惊喜', emoji: '🎁' },
]

// 餐厅示例信息（真实场景中由 QR 参数注入）
export const RESTAURANT = {
  name: '松活厨房',
  englishName: 'Sonho Kitchen',
  tagline: '把每一餐，都过成值得纪念的日子',
  location: '湖南 · 常德',
}
