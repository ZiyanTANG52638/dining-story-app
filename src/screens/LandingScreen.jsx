// QR 落地页 —— Sonho Kitchen 暖色手作风格的"记忆邀请"
//
// 视觉语言：Apple Journal + MUJI + 日式咖啡品牌 + 编辑杂志
//   - 暖米色留白背景（非奢华酒店、非纯黑）
//   - 手作纸张质感 + 柔和天蓝点缀
//   - 食物 hero 居中，营造"收藏一晚"的邀请感
import { RESTAURANT } from '../data/photos'
import Icon from '../components/Icon'
import { BottomSafe } from '../components/ui'

export default function LandingScreen({ onStart }) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-beige-100">
      {/* ---- 柔和暖色氛围（浅色，非深色光晕） ---- */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-[-6rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(159,195,212,0.35),transparent_65%)] blur-2xl animate-drift" />
        <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(214,191,156,0.4),transparent_65%)] blur-2xl animate-drift" style={{ animationDelay: '-6s' }} />
        <div className="absolute bottom-0 left-1/2 h-64 w-[30rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(247,240,227,0.9),transparent_70%)] blur-2xl" />
        {/* 柔和天蓝细线 */}
        <div className="sky-rule absolute left-1/2 top-12 w-24 -translate-x-1/2" />
      </div>

      {/* ---- 食物 hero（居中，暖色手作占位） ---- */}
      <div className="relative z-0 mt-14 flex flex-col items-center px-8">
        <div className="relative w-full max-w-[19rem]">
          {/* 主菜 hero 卡 */}
          <div className="photo-card aspect-[4/5] w-full animate-float" style={{ '--rot': '-1.5deg' }}>
            <DishArt variant="signature" />
          </div>
          {/* 柔和天蓝标签 */}
          <div className="glass-light absolute -right-3 top-6 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-coffee-500">
            <Icon name="dish" size={13} />
            <span className="text-[11px] font-medium">今晚的主角</span>
          </div>
        </div>
      </div>

      {/* ---- 中央邀请文案（大量留白） ---- */}
      <div className="relative z-10 mt-10 flex flex-col items-center px-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.35em] text-coffee-400">{RESTAURANT.location}</p>
        <h1 className="story-display mt-3 text-4xl tracking-wide text-coffee-600">{RESTAURANT.name}</h1>
        <p className="mt-2 text-[12px] uppercase tracking-[0.45em] text-coffee-300">{RESTAURANT.englishName}</p>

        <div className="mt-8">
          <p className="story-display text-[1.9rem] leading-snug text-coffee-600">
            把这一晚，
            <br />
            收进<span className="text-gradient-gold">值得记住的回忆</span>
          </p>
          <p className="editorial-body mx-auto mt-4 max-w-[16rem] text-[13px] text-coffee-400">
            一张主角照片，两幕温柔瞬间。
            <br />
            让这一餐，成为你愿意反复回味的夜晚。
          </p>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={onStart}
          className="group mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-coffee-500 px-9 py-4 text-base font-semibold text-beige-50 shadow-lg shadow-coffee-500/25 transition-all duration-300 hover:bg-coffee-600 active:scale-[0.98]"
        >
          开始收藏今晚
          <Icon name="arrow" size={18} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>

        <p className="mt-5 text-[11px] tracking-wide text-coffee-300">
          无需注册 · 只为珍藏你的记忆
        </p>
      </div>

      <div className="mt-auto">
        <BottomSafe />
      </div>
    </div>
  )
}

// 用 CSS 渐变 + 造型模拟"招牌菜"摄影（暖色手作占位）
function DishArt({ variant }) {
  const art = {
    signature: {
      bg: 'linear-gradient(150deg,#f3e6d2 0%,#e5d0ae 55%,#c9a06a 100%)',
      plate: 'rgba(255,253,248,0.98)',
      food: 'radial-gradient(circle at 42% 36%, #e8b06a, #b06a3a 72%)',
      glow: 'rgba(255,255,255,0.6)',
      leaf: 'rgba(122,154,120,0.5)',
    },
  }[variant]

  return (
    <div className="relative h-full w-full" style={{ background: art.bg }}>
      {/* 餐盘 */}
      <div className="absolute left-1/2 top-1/2 aspect-square w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: art.plate, boxShadow: '0 14px 34px rgba(122,90,62,0.3)' }}>
        <div className="absolute inset-[13%] rounded-full" style={{ background: art.food }} />
        {/* 高光 */}
        <div className="absolute left-[30%] top-[26%] h-[20%] w-[20%] rounded-full blur-[2px]"
          style={{ background: art.glow }} />
        {/* 点缀叶（手作感） */}
        <div className="absolute right-[22%] top-[24%] h-6 w-3 rotate-[-30deg] rounded-full blur-[1px]"
          style={{ background: art.leaf }} />
      </div>
      {/* 底部柔和渐隐 */}
      <div className="absolute inset-0 bg-gradient-to-t from-beige-200/40 via-transparent to-transparent" />
    </div>
  )
}
