// StoryCanvas —— 固定设计画布预览渲染器
//
// 设计原则：
//   - 逻辑画布固定 1080 × 1920，所有图层绝对定位（Figma frame / Canva poster 思路）
//   - 整块画布用 CSS transform: scale() 等比缩放，transform-origin: top left
//   - 不在预览内部做响应式重排；照片只决定裁切内容
//   - 与 Canvas 导出共用 templates.js 的同一份 slots 配置与装饰参数
//   - 绘制顺序与 renderTemplate.js 完全一致，保证预览 = 导出
//
// 用法：
//   <StoryCanvas templateId="editorial" photos={photos} story={story} caption={caption} />
//   外层容器需自行保持 9:16 比例。

import { useEffect, useMemo, useRef, useState } from 'react'
import { RESTAURANT } from '../data/photos'
import {
  CANVAS_H,
  CANVAS_W,
  getTemplate,
} from '../lib/templates'
import { semantic } from '../lib/designTokens'
import { ORGANIC_POINTS } from '../lib/decor'
import {
  assignPhotosToSlots,
  clampText,
  computePreviewScale,
  resolveFocal,
} from '../lib/layoutEngine'
import {
  DateStamp,
  HandDrawnLine,
  MemoryNumber,
  PaperLayer,
  PaperTexture,
  SmallDot,
  SmallStar,
  Tape,
} from './StoryDecor'

const FONT = '"PingFang SC", "Noto Sans SC", sans-serif'

// 有机 blob → SVG clipPath（与 decor.js organicPath 同一组控制点，保证预览 = 导出）
// 用二次贝塞尔平滑连接，路径坐标基于 0~1 归一化空间。
function organicClipPathD() {
  const P = ORGANIC_POINTS.map(([px, py]) => [(px + 1) / 2, (py + 1) / 2])
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const start = mid(P[P.length - 1], P[0])
  let d = `M ${start[0]} ${start[1]}`
  for (let i = 0; i < P.length; i += 1) {
    const cur = P[i]
    const next = P[(i + 1) % P.length]
    const m = mid(cur, next)
    d += ` Q ${cur[0]} ${cur[1]} ${m[0]} ${m[1]}`
  }
  return `${d} Z`
}

const ORGANIC_CLIP_ID = 'sonho-organic-clip'

// 遮罩 → CSS
function maskStyle(mask) {
  if (mask === 'circle') return { borderRadius: '50%' }
  if (mask === 'organic') {
    return { clipPath: `url(#${ORGANIC_CLIP_ID})` }
  }
  return null
}

function slotStyle(slot, { clip = true } = {}) {
  const base = {
    position: 'absolute',
    left: `${slot.x}px`,
    top: `${slot.y}px`,
    width: `${slot.width}px`,
    height: `${slot.height}px`,
  }
  if (slot.rotate) {
    base.transform = `rotate(${slot.rotate}deg)`
  }
  if (clip) {
    const m = maskStyle(slot.mask)
    if (m) {
      // 有机 / 圆形遮罩：用 clipPath，阴影改用 drop-shadow 跟随轮廓
      Object.assign(base, m)
      if (slot.shadow) {
        base.filter = 'drop-shadow(0 14px 34px rgba(90,60,35,0.28))'
      }
    } else {
      base.overflow = 'hidden'
      base.borderRadius = `${slot.radius || 0}px`
      if (slot.shadow) {
        base.boxShadow = '0 14px 40px rgba(90,60,35,0.28)'
        base.background = semantic.surfacePaper
      }
    }
  }
  return base
}

export default function StoryCanvas({
  templateId,
  photos = [],
  story = {},
  caption = '',
  heroCutout = null,
  className = '',
}) {
  const tpl = useMemo(() => getTemplate(templateId), [templateId])
  const wrapRef = useRef(null)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      if (w) setScale(computePreviewScale(w, CANVAS_W))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const slotPhotos = useMemo(
    () => assignPhotosToSlots(tpl.slots, photos),
    [tpl, photos],
  )

  const bg = tpl.background || {}
  const bgStyle =
    bg.type === 'linear'
      ? `linear-gradient(180deg, ${bg.from || semantic.backgroundPrimary} 0%, ${
          bg.mid ? `${bg.mid} 55%, ` : ''
        }${bg.to || '#efe4d0'} 100%)`
      : semantic.backgroundPrimary

  const displayCaption = clampText(caption || tpl.caption, tpl.textBlocks?.[0]?.limit)
  const d = tpl.decorative || {}

  return (
    <div ref={wrapRef} className={`relative w-full ${className}`}>
      {/* 占位：保持精确 9:16 高度 */}
      <div style={{ paddingTop: `${(CANVAS_H / CANVAS_W) * 100}%` }} />
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div
          style={{
            width: `${CANVAS_W}px`,
            height: `${CANVAS_H}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            left: 0,
            top: 0,
            background: bgStyle,
          }}
        >
          {/* 0. 有机遮罩定义（objectBoundingBox，随 slot 尺寸自适应） */}
          <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
            <defs>
              <clipPath id={ORGANIC_CLIP_ID} clipPathUnits="objectBoundingBox">
                <path d={organicClipPathD()} />
              </clipPath>
            </defs>
          </svg>

          {/* 1. 纸层 */}
          {(tpl.paperLayers || []).map((p, i) => (
            <PaperLayer key={`paper-${i}`} {...p} />
          ))}

          {/* 2. 品牌页眉 */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: `${CANVAS_W}px`,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                marginTop: '78px',
                fontSize: '40px',
                fontWeight: 600,
                color: semantic.textPrimary,
                fontFamily: FONT,
              }}
            >
              {RESTAURANT.name}
            </div>
            <div
              style={{
                marginTop: '6px',
                fontSize: '20px',
                fontWeight: 500,
                color: semantic.textSecondary,
                fontFamily: FONT,
              }}
            >
              {RESTAURANT.englishName}
            </div>
            <div
              style={{
                width: '120px',
                height: '3px',
                margin: '14px auto 0',
                background: semantic.decorativeLine,
              }}
            />
          </div>

          {/* 3. Editorial 大字骨架 */}
          {(tpl.words || []).map((w, i) => (
            <div
              key={`word-${i}`}
              style={{
                position: 'absolute',
                left: `${w.x}px`,
                top: `${w.y}px`,
                fontSize: `${w.size}px`,
                fontWeight: 700,
                color: semantic.textPrimary,
                lineHeight: 1,
                fontFamily: FONT,
              }}
            >
              {w.text}
            </div>
          ))}

          {/* 4. 照片 slots */}
          {tpl.slots.map((slot) => {
            const photo = slotPhotos[slot.id]
            const isHero = slot.id === 'hero'
            const cutoutSrc = isHero && heroCutout?.isCutout ? heroCutout.src : null
            const src = cutoutSrc || photo?.src
            if (!src) return null

            const focal = resolveFocal(slot, photo)

            if (isHero && cutoutSrc) {
              return (
                <div key={slot.id} style={slotStyle(slot, { clip: false })}>
                  <img
                    src={src}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 26px 60px rgba(90,60,35,0.30))',
                    }}
                  />
                </div>
              )
            }

            return (
              <div key={slot.id} style={slotStyle(slot)}>
                <img
                  src={src}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: `${Math.round((focal?.x ?? 0.5) * 100)}% ${Math.round(
                      (focal?.y ?? 0.5) * 100,
                    )}%`,
                  }}
                />
              </div>
            )
          })}

          {/* 5. 徽标 */}
          {tpl.badge && (
            <div
              style={{
                position: 'absolute',
                left: `${tpl.badge.x}px`,
                top: `${tpl.badge.y}px`,
                width: `${tpl.badge.width}px`,
                height: `${tpl.badge.height}px`,
                borderRadius: `${tpl.badge.radius || tpl.badge.height / 2}px`,
                background: tpl.badge.bg || semantic.brandAccent,
                color: tpl.badge.color || semantic.surfacePaper,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 600,
                fontFamily: FONT,
              }}
            >
              {tpl.badge.text}
            </div>
          )}

          {/* 6. 手绘线 */}
          {(tpl.lines || []).map((l, i) => (
            <HandDrawnLine key={`line-${i}`} {...l} />
          ))}

          {/* 7. 装饰：记忆编号 / 星点 / 注释 / 印章 */}
          {d.memoryNumber && (
            <MemoryNumber
              x={(tpl.memoryNumber || { x: 90, y: 230 }).x}
              y={(tpl.memoryNumber || { x: 90, y: 230 }).y}
              number={tpl.index || '01'}
            />
          )}

          {(tpl.stars || []).map((s, i) => (
            <SmallStar key={`star-${i}`} {...s} />
          ))}
          {(tpl.dots || []).map((p, i) => (
            <SmallDot key={`dot-${i}`} {...p} />
          ))}

          {tpl.annotation && (
            <div
              style={{
                position: 'absolute',
                left: `${tpl.annotation.x}px`,
                top: `${tpl.annotation.y}px`,
                transform: `translateY(-50%) rotate(${tpl.annotation.rotate || 0}deg)`,
                fontSize: `${tpl.annotation.size}px`,
                fontWeight: 400,
                color: tpl.annotation.color || semantic.memoryAccent,
                fontFamily: FONT,
                whiteSpace: 'nowrap',
              }}
            >
              {tpl.annotation.text || '今晚，值得记住'}
            </div>
          )}

          {tpl.stamp && (
            <DateStamp
              x={tpl.stamp.x}
              y={tpl.stamp.y}
              text={story?.date || ''}
              size={tpl.stamp.size}
              rotate={tpl.stamp.rotate}
            />
          )}

          {/* 8. 元数据（日期 · 地点） */}
          {tpl.meta && (
            <DateStamp
              x={tpl.meta.x}
              y={tpl.meta.y}
              text={`${story?.date || ''}   ·   ${RESTAURANT.location}`}
              size={tpl.meta.size}
              color={tpl.meta.color}
              align={tpl.meta.align}
            />
          )}

          {/* 9. 文本块 */}
          {(tpl.textBlocks || []).map((tb) => (
            <div
              key={tb.id}
              style={{
                position: 'absolute',
                left: `${tb.x}px`,
                top: `${tb.y}px`,
                width: `${tb.maxWidth}px`,
                transform: tb.align === 'center' ? 'translateX(-50%)' : 'none',
                textAlign: tb.align || 'left',
                color: tb.color || semantic.textPrimary,
                fontSize: `${tb.size}px`,
                lineHeight: `${tb.lineHeight}px`,
                fontFamily: FONT,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {tb.id === 'caption' ? displayCaption : ''}
            </div>
          ))}

          {/* 10. 品牌页脚 */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: `${CANVAS_H - 96}px`,
              width: `${CANVAS_W}px`,
              textAlign: 'center',
              fontSize: '26px',
              color: semantic.textMuted,
              fontFamily: FONT,
            }}
          >
            {`${story?.date || ''}   ·   ${RESTAURANT.tagline}`}
          </div>

          {/* 11. 胶带（绘制在照片之上，最多 2 处） */}
          {(tpl.tapes || []).map((t, i) => (
            <Tape key={`tape-${i}`} {...t} />
          ))}

          {/* 12. 纸纹 */}
          <PaperTexture width={CANVAS_W} height={CANVAS_H} opacity={tpl.paperTexture} />

          {/* 13. 暖色暗角 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 50% 50%, rgba(122,90,62,0) 32%, rgba(122,90,62,0.10) 78%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  )
}
