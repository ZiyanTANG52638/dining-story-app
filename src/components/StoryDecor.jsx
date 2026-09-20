// 装饰组件（预览端）—— SVG / CSS 矢量组件
//
// 设计原则：
//   - 与 Canvas 导出端 decor.js 视觉参数一一对应（同一份令牌）
//   - 全部矢量，不用栅格 PNG，保证预览与导出清晰一致
//   - 轻量：胶带最多 2 处，纸纹极低透明度
//
// 组件：
//   <Tape />         半透明胶带
//   <PaperLayer />   纸层
//   <DateStamp />    日期印章
//   <MemoryNumber /> 记忆编号
//   <HandDrawnLine />手绘线
//   <SmallStar />    小星
//   <SmallDot />     小点
//   <PaperTexture /> 纸纹

import { semantic } from '../lib/designTokens'

const FONT = '"PingFang SC", "Noto Sans SC", sans-serif'

// ---- 胶带 ----

export function Tape({ x, y, width, height, rotate = 0, color = semantic.tapeCream, opacity = 0.6 }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: `rotate(${rotate}deg)`,
        opacity,
        background: color,
        clipPath:
          'polygon(0% 6%, 3% 0%, 97% 2%, 100% 8%, 99% 94%, 95% 100%, 4% 98%, 1% 92%)',
        backgroundImage:
          'radial-gradient(rgba(255,255,255,0.5) 0.5px, transparent 0.6px)',
        backgroundSize: '7px 7px',
      }}
    />
  )
}

// ---- 纸层 ----

export function PaperLayer({ x, y, width, height, radius = 20, fill = semantic.surfacePaper, rotate = 0, shadow = true }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: `${radius}px`,
        background: fill,
        transform: `rotate(${rotate}deg)`,
        boxShadow: shadow ? '0 12px 34px rgba(90,60,35,0.18)' : 'none',
      }}
    />
  )
}

// ---- 日期印章 ----

export function DateStamp({ x, y, text, size = 24, color = semantic.textMuted, rotate = 0, align = 'left' }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        transform: `translateY(-50%) rotate(${rotate}deg)`,
        fontSize: `${size}px`,
        fontWeight: 500,
        color,
        fontFamily: FONT,
        whiteSpace: 'nowrap',
        textAlign: align,
      }}
    >
      {text}
    </div>
  )
}

// ---- 记忆编号 ----

export function MemoryNumber({ x, y, number = '01', size = 26, color = semantic.brandAccentDeep }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translateY(-50%)',
        fontSize: `${size}px`,
        fontWeight: 600,
        color,
        fontFamily: FONT,
      }}
    >
      {`No. ${number}`}
    </div>
  )
}

// ---- 手绘线 ----

export function HandDrawnLine({ x, y, width, color = semantic.decorativeLine, thickness = 4 }) {
  return (
    <svg
      style={{ position: 'absolute', left: `${x}px`, top: `${y - 8}px`, overflow: 'visible' }}
      width={width}
      height={16}
    >
      <path
        d={`M0,8 Q${width * 0.5},5 ${width},9`}
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

// ---- 小星 ----

export function SmallStar({ x, y, size = 14, color = semantic.brandAccent, opacity = 0.8 }) {
  const outer = size
  const inner = size * 0.34
  const pts = []
  for (let i = 0; i < 8; i += 1) {
    const r = i % 2 === 0 ? outer : inner
    const a = (Math.PI / 4) * i - Math.PI / 2
    pts.push(`${outer + Math.cos(a) * r},${outer + Math.sin(a) * r}`)
  }
  return (
    <svg
      style={{ position: 'absolute', left: `${x - outer}px`, top: `${y - outer}px`, opacity }}
      width={outer * 2}
      height={outer * 2}
    >
      <polygon points={pts.join(' ')} fill={color} />
    </svg>
  )
}

// ---- 小点 ----

export function SmallDot({ x, y, size = 5, color = semantic.brandAccent, opacity = 0.7 }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x - size}px`,
        top: `${y - size}px`,
        width: `${size * 2}px`,
        height: `${size * 2}px`,
        borderRadius: '50%',
        background: color,
        opacity,
      }}
    />
  )
}

// ---- 纸纹 ----

export function PaperTexture({ width, height, opacity = 0.04 }) {
  if (!opacity) return null
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: `${width}px`,
        height: `${height}px`,
        opacity,
        backgroundImage:
          'radial-gradient(rgba(95,69,48,0.9) 0.5px, transparent 0.6px)',
        backgroundSize: '7px 7px',
        pointerEvents: 'none',
      }}
    />
  )
}
