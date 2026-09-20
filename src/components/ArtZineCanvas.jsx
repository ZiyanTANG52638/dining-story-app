// Art Zine 结果展示 —— 呈现「被编排的一页」
//
// 与 StoryCanvas 的区别：
//   · StoryCanvas 是确定性排版引擎的实时预览（DOM 合成）
//   · ArtZineCanvas 展示的是生成服务返回的成品图（当前为 demo 图）
//
// 未来接入真实服务时，只需把 url 换成后端返回的图片地址，组件无需改动。
import { useState } from 'react'
import { ART_ZINE_FALLBACK } from '../lib/artZineCopy'
import Icon from '../components/Icon'

export default function ArtZineCanvas({ url, loading = false, error = false, onFallback }) {
  const [loaded, setLoaded] = useState(false)

  // 生成失败：绝不留下空白，提供「先保存为经典收藏」兜底
  if (error) {
    return (
      <div className="art-zine-frame art-zine-frame--error">
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <Icon name="heart" size={26} className="text-coffee-300" />
          <p className="text-sm text-coffee-500">{ART_ZINE_FALLBACK.message}</p>
          <button
            type="button"
            onClick={onFallback}
            className="rounded-full border border-coffee-400/30 bg-cream-50 px-4 py-2 text-xs text-coffee-600 transition-colors hover:bg-cream-100"
          >
            {ART_ZINE_FALLBACK.action}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="art-zine-frame">
      {loading || !loaded ? (
        <div className="art-zine-skeleton">
          <div className="art-zine-skeleton__shimmer" />
          <p className="art-zine-skeleton__text">正在装订这一页…</p>
        </div>
      ) : null}
      {url ? (
        <img
          src={url}
          alt="艺术纸刊作品"
          onLoad={() => setLoaded(true)}
          className={`art-zine-image ${loaded ? 'art-zine-image--on' : ''}`}
        />
      ) : null}
    </div>
  )
}
