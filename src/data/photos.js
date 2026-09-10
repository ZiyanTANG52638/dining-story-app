// 三张照片的引导定义 —— 用"故事章节"而非"任务"来引导用户
//
// Sonho Kitchen 构图原则：1 张 Hero（主角）+ 2 张支持照片（Memory Snapshots）
//   - 不鼓励等权构图
//   - 第二张"招牌时刻"是 Hero，占据视觉主导
//   - 第一、三张是氛围与陪伴的支持镜头
//
// 心理原则：不评判、不说"正确拍法"、保留用户自主权。
// 摄影即老师：Hero 照片本身已传达拍摄语言，界面不再重复解释。
//
// 图片统一通过 assetUrl() 引用（兼容 GitHub Pages 子路径部署）。
import { PHOTOS } from '../lib/assets'

export const PHOTO_STEPS = [
  {
    id: 'first-impression',
    role: 'snapshot', // 支持照片：环境氛围
    chapter: '空间',
    index: '01',
    eyebrow: 'CAPTURE THE ATMOSPHERE',
    title: '记录今晚的空间',
    subtitle: '环境 · 光 · 气息',
    prompt: '拍下今晚第一眼让你记住的地方。',
    // 轻量摄影提醒（小字，无重容器）
    reminders: ['留一点呼吸', '捕捉暖光与木桌', '不必拍满整个画面'],
    icon: 'sparkle',
    // Hero 照片：真实餐厅氛围照，本身就是拍摄语言
    photo: PHOTOS.atmosphere,
    photoAlt: '暖光下的餐厅空间氛围',
  },
  {
    id: 'signature-moment',
    role: 'hero', // Hero：招牌主角
    chapter: '主角',
    index: '02',
    eyebrow: 'MAKE ONE DISH THE HERO',
    title: '让一道菜成为主角',
    subtitle: '招牌 · 主菜',
    prompt: '靠近一点，让今晚最喜欢的一道菜成为画面中心。',
    reminders: ['靠近一点', '让热气与光泽清晰', '侧光下更立体'],
    icon: 'dish',
    photo: PHOTOS.heroDish,
    photoAlt: '主菜特写的光泽与构图',
  },
  {
    id: 'memory-moment',
    role: 'snapshot', // 支持照片：相聚陪伴
    chapter: '同行',
    index: '03',
    eyebrow: 'CAPTURE THE MOMENT',
    title: '记住一起吃饭的人',
    subtitle: '相聚 · 举杯',
    prompt:
      '不用再拍一道菜。一次夹菜、碰杯、递过来的碗，也可以成为今晚最值得记住的瞬间。',
    reminders: ['抓拍自然的互动', '让餐桌与朋友入镜', '举起杯子，让故事有温度'],
    icon: 'heart',
    photo: PHOTOS.together,
    photoAlt: '一起吃饭的人与互动瞬间',
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
