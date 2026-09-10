// QR 落地页 —— 编辑杂志封面式的居中构图
//
// 视觉语言：Apple Journal + Kinfolk + Cereal + MUJI + 日式独立咖啡品牌
//   - 餐厅本身成为视觉 hero（真实照片，非插画）
//   - 居中编辑式构图：Hero 照 → Logo → SONHO KITCHEN → 主标题 → 支持句 → CTA
//   - Logo 属于 Hero 构图的一部分，而非导航栏
//   - 摄影优先：70% 摄影 / 30% 界面
import { RESTAURANT } from '../data/photos'
import { PHOTOS } from '../lib/assets'
import Icon from '../components/Icon'
import { BottomSafe } from '../components/ui'

export default function LandingScreen({ onStart }) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-beige-100">
      {/* ---- 柔和暖色氛围（浅色，非深色光晕） ---- */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-[-6rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(159,195,212,0.28),transparent_65%)] blur-2xl animate-drift" />
        <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(214,191,156,0.34),transparent_65%)] blur-2xl animate-drift" style={{ animationDelay: '-6s' }} />
      </div>

      {/* ---- Hero：真实餐厅环境照（编辑式画框，居中） ---- */}
      <div className="relative z-0 mt-8 px-5">
        <div className="editorial-frame photo-vignette photo-bottom-gradient relative mx-auto h-[38svh] min-h-[17rem] w-full max-w-md">
          <img
            src={PHOTOS.environment}
            alt="松活厨房的餐厅环境"
            className="photo-warm"
            loading="eager"
          />

          {/* 玻璃胶囊：今晚的主角 */}
          <div className="glass-capsule absolute left-5 top-5 flex items-center gap-1.5 rounded-full px-3.5 py-1.5">
            <Icon name="dish" size={13} className="text-beige-50" />
            <span className="text-[11px] font-medium text-beige-50 photo-text-shadow">今晚的主角</span>
          </div>
        </div>
      </div>

      {/* ---- 居中编辑式文案区（Logo 属于 Hero 构图） ---- */}
      <div className="relative z-10 mt-8 flex flex-col items-center px-8 text-center">
        {/* Logo */}
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-coffee-400/40 text-coffee-500">
          <Icon name="dish" size={19} />
        </span>

        {/* 餐厅名 */}
        <h1 className="story-display mt-4 text-[2rem] tracking-wide text-coffee-600">{RESTAURANT.name}</h1>
        <p className="mt-1.5 text-[11px] uppercase tracking-[0.42em] text-coffee-300">
          {RESTAURANT.englishName}
        </p>

        <div className="sky-rule mt-5 w-16" />

        {/* 主标题 */}
        <p className="story-display mt-6 text-[1.75rem] leading-snug text-coffee-600">
          把这一晚，
          <br />
          收进<span className="text-gradient-gold">值得记住的回忆</span>
        </p>

        {/* 支持句 */}
        <p className="editorial-body mx-auto mt-4 max-w-[16rem] text-[13px] text-coffee-400">
          一张主角照片，两幕温柔瞬间。
          <br />
          让这一餐，成为你愿意反复回味的夜晚。
        </p>

        {/* CTA */}
        <button
          type="button"
          onClick={onStart}
          className="group mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-coffee-500 px-9 py-4 text-base font-semibold text-beige-50 shadow-lg shadow-coffee-500/20 transition-all duration-300 hover:bg-coffee-600 active:scale-[0.98]"
        >
          开始收藏今晚
          <Icon name="arrow" size={18} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>

        <p className="mt-4 text-[11px] tracking-wide text-coffee-300">
          无需注册 · 只为珍藏你的记忆
        </p>
      </div>

      <div className="mt-auto">
        <BottomSafe />
      </div>
    </div>
  )
}
