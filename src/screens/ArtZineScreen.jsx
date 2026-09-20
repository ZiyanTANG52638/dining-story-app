// Art Zine 过渡屏 —— 「把今晚重新装订成一页」
//
// 设计原则：
//   - 平静、克制、有节奏的加载动画（非技术感 spinner）
//   - 三句文案依次浮现，营造「重新编排」的过程感
//   - 绝不出现 AI / model / processing / API 等技术词
//   - 不渲染固定画布，只呈现「正在装订」的状态
import { useEffect, useState } from 'react'
import { ART_ZINE_STEPS } from '../lib/artZineCopy'
import Icon from '../components/Icon'

export default function ArtZineScreen({ onDone, onFallback }) {
  const [stepIndex, setStepIndex] = useState(0)

  // 三句文案依次浮现
  useEffect(() => {
    const timers = []
    ART_ZINE_STEPS.forEach((_, i) => {
      if (i === 0) return
      timers.push(setTimeout(() => setStepIndex(i), i * 900))
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-8 text-center animate-fade-in">
      {/* 柔和的纸面光晕背景 */}
      <div className="art-zine-aura" aria-hidden="true" />

      {/* 平静的装订动画：三张纸片缓缓聚拢 */}
      <div className="art-zine-compose" aria-hidden="true">
        <span className="art-zine-sheet art-zine-sheet--1" />
        <span className="art-zine-sheet art-zine-sheet--2" />
        <span className="art-zine-sheet art-zine-sheet--3" />
        <span className="art-zine-sparkle">
          <Icon name="sparkle" size={18} />
        </span>
      </div>

      {/* 三句文案依次浮现 */}
      <div className="relative z-10 mt-10 flex min-h-[5.5rem] flex-col items-center gap-2">
        {ART_ZINE_STEPS.map((text, i) => (
          <p
            key={text}
            className={`art-zine-step ${i <= stepIndex ? 'art-zine-step--on' : ''} ${
              i === stepIndex ? 'art-zine-step--current' : ''
            }`}
          >
            {text}
          </p>
        ))}
      </div>

      {/* 兜底入口：绝不留下空白 */}
      <button
        type="button"
        onClick={onFallback}
        className="relative z-10 mt-10 text-xs text-coffee-300 transition-colors hover:text-coffee-500"
      >
        先保存为经典收藏
      </button>

      {/* 隐藏的完成触发器（由父级控制时序） */}
      <ArtZineDoneTrigger onDone={onDone} />
    </div>
  )
}

// 在动画节奏结束后通知父级（保持组件纯净，不直接调用生成）
function ArtZineDoneTrigger({ onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 3000)
    return () => clearTimeout(t)
  }, [onDone])
  return null
}
