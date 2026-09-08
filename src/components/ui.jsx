// 通用 UI 小组件 —— Sonho Kitchen 暖色手作风格
import Icon from './Icon'

// 章节进度指示器（三颗点 / 章节标签）
export function ChapterProgress({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {i > 0 && (
            <div
              className={`h-px w-6 transition-colors duration-500 ${
                i <= current ? 'bg-coffee-400' : 'bg-coffee-300/30'
              }`}
            />
          )}
          <div
            className={`flex items-center justify-center rounded-full border transition-all duration-500 ${
              i < current
                ? 'h-6 w-6 border-coffee-500 bg-coffee-500 text-beige-50'
                : i === current
                  ? 'h-7 w-7 border-coffee-500 bg-coffee-500/15 text-coffee-600'
                  : 'h-6 w-6 border-coffee-300/40 text-coffee-300'
            }`}
          >
            {i < current ? (
              <Icon name="check" size={13} />
            ) : (
              <span className="text-[11px] font-semibold">{i + 1}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// 主按钮 —— 咖啡棕实心（暖色手作）
export function PrimaryButton({ children, onClick, disabled, className = '', icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group inline-flex items-center justify-center gap-2 rounded-full bg-coffee-500 px-8 py-4 text-base font-semibold text-beige-50 shadow-lg shadow-coffee-500/20 transition-all duration-300 hover:bg-coffee-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${className}`}
    >
      {children}
      {icon && (
        <Icon
          name={icon}
          size={18}
          className="transition-transform duration-300 group-hover:translate-x-0.5"
        />
      )}
    </button>
  )
}

// 次级按钮 —— 描边咖啡棕
export function GhostButton({ children, onClick, className = '', icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-coffee-400/40 px-6 py-3 text-sm font-medium text-coffee-500 transition-all duration-300 hover:border-coffee-500 hover:text-coffee-600 ${className}`}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  )
}

// 顶部返回/关闭条
export function TopBar({ onBack, title, right }) {
  return (
    <div className="flex items-center justify-between px-5 pt-5">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-coffee-400/30 text-coffee-500 transition-colors hover:border-coffee-500 hover:text-coffee-600"
          aria-label="返回"
        >
          <Icon name="back" size={20} />
        </button>
      ) : (
        <div className="h-10 w-10" />
      )}
      {title && (
        <span className="font-serif text-lg tracking-wide text-coffee-600">{title}</span>
      )}
      <div className="h-10 w-10">{right}</div>
    </div>
  )
}

// 底部安全区
export function BottomSafe() {
  return <div className="h-[env(safe-area-inset-bottom)]" />
}
