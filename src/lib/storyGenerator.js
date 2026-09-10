// AI 餐饮记忆叙事生成器（原型版）
//
// 真实场景：将照片 + 识别到的菜品 + 用户选择 发送给 LLM，
// 生成一段有温度、可编辑的"记忆叙事"。
// 原型阶段：基于模板 + 用户选择组合生成，保证稳定且可编辑。
//
// 设计原则：输出"生活方式叙事"，而非数据库标签。
//   例如："以生蚝开场，以巧克力熔岩收尾的一晚。"
//   每张记忆卡都应感觉独特（可收藏物件），标题随瞬间变化。

import { RESTAURANT } from '../data/photos'

// 陪伴对象 → 情感化称呼
const COMPANION_LABEL = {
  friends: '挚友',
  family: '家人',
  date: '那个特别的人',
  colleagues: '同行的伙伴',
  solo: '独享的慢时光',
}

// 陪伴对象 → 开场叙事
const COMPANION_OPENING = {
  friends: '和挚友围坐，笑声让整张桌子都亮了起来',
  family: '家人围坐一桌，连空气都变得柔软',
  date: '和那个特别的人，把时间过得很慢很慢',
  colleagues: '和同行的伙伴，把忙碌暂时留在了门外',
  solo: '一个人，也把这一餐过得郑重其事',
}

// 难忘瞬间 → 情感化收尾
const MOMENT_PHRASE = {
  'first-bite': '第一口就让人屏住呼吸',
  toast: '举杯相庆，杯沿碰出清脆的祝福',
  laugh: '笑到停不下来，眼角都起了褶',
  ambience: '被暖光与香气温柔包裹',
  dessert: '甜品收尾，甜得刚刚好',
  surprise: '意料之外的惊喜，让夜晚更完整',
}

// 难忘瞬间 → 独特标题意象（让每张记忆卡都不同）
const MOMENT_TITLE = {
  'first-bite': '以第一口惊艳开场',
  toast: '为此刻，轻轻举杯',
  laugh: '笑到停不下来的夜晚',
  ambience: '被氛围温柔包裹的一晚',
  dessert: '以一抹甜，收尾这一晚',
  surprise: '藏着惊喜的一晚',
}

// 难忘瞬间 → 收藏卡副标题（物件感）
const MOMENT_SUBTITLE = {
  'first-bite': '味蕾记住的第一秒',
  toast: '杯沿相碰的祝福',
  laugh: '眼角泛起的笑意',
  ambience: '暖光与香气',
  dessert: '恰到好处的甜',
  surprise: '意料之外的圆满',
}

// 生成记忆叙事数据
export async function generateStory({ companion, favoriteMoment, dishes, photoCount }) {
  // 模拟 AI 生成延迟
  await sleep(1200 + Math.random() * 800)

  const companionLabel = COMPANION_LABEL[companion] || '朋友'
  const opening = COMPANION_OPENING[companion] || '我们围坐在一起'
  const momentPhrase = MOMENT_PHRASE[favoriteMoment] || '难忘的瞬间'
  const titlePhrase = MOMENT_TITLE[favoriteMoment] || '值得记住的一晚'
  const subtitle = MOMENT_SUBTITLE[favoriteMoment] || '值得记住的一晚'

  // 从识别到的菜品中挑选 2-3 个作为"这一餐的轨迹"
  const allDishes = dishes.flat().filter(Boolean)
  const unique = [...new Set(allDishes)]
  const enjoyed = unique.slice(0, 3)

  // 独特标题（随瞬间变化，非固定"值得记住的一晚"）
  const headline = titlePhrase
  // 叙事正文
  const body = `在${RESTAURANT.name}，${opening}。${
    enjoyed.length ? `从${enjoyed[0]}开始，` : ''
  }最难忘的是${momentPhrase}。`

  return {
    headline,
    titlePhrase,
    subtitle,
    body,
    companion: companionLabel,
    enjoyed,
    favoriteMoment: momentPhrase,
    photoCount,
    restaurant: RESTAURANT.name,
    location: RESTAURANT.location,
    date: formatToday(),
    // 供编辑的原始字段（以"润色叙事"的方式呈现）
    editable: {
      headline,
      companion: companionLabel,
      enjoyedText: enjoyed.join('、'),
      momentText: momentPhrase,
    },
  }
}

function formatToday() {
  const d = new Date()
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getMonth() + 1}月${d.getDate()}日 · 周${week}`
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
