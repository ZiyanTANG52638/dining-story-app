// 导出视图 —— Sonho Kitchen 暖色手作风格的"记忆杂志"呈现
//
// Hero-first：Hero 照片主导，其余为 Memory Snapshots
// 分享图预览像一张可收藏的明信片/手作卡片
import { useEffect, useState } from 'react'
import { exportStoryImage } from '../lib/exportStory'
import { buildMemoryTheme, makeBlurredBg } from '../lib/visuals'
import Icon from '../components/Icon'
import { PrimaryButton, GhostButton, BottomSafe } from '../components/ui'

export default function ExportScreen({ photos, story, companionObj, momentObj, onRestart }) {
  // 模板与短文案从 story 中读取（由 StoryScreen 写入）
  const templateId = story?.templateId
  const caption = story?.caption
  // Art Zine 模式：直接使用生成服务返回的成品图，不走 Canvas 模板
  const artZineUrl = story?.artZineUrl || null
  const isArtZine = !!artZineUrl
  // 优先使用归一化照片（与预览同源），保证预览 = 导出
  const renderPhotos = story?.normalizedPhotos?.length ? story.normalizedPhotos : photos
  const [exported, setExported] = useState(null)
  const [exporting, setExporting] = useState(true)
  const [copied, setCopied] = useState(false)
  const [theme, setTheme] = useState(null)
  const [photoBg, setPhotoBg] = useState(null)

  // 生成分享图 + 提取氛围（用 Hero 照片）
  useEffect(() => {
    let cancelled = false
    const hero = pickHeroPhoto(photos)
    const heroSrc = hero?.url || hero?.src
    if (heroSrc) {
      Promise.all([buildMemoryTheme(heroSrc), makeBlurredBg(heroSrc)]).then(([t, bg]) => {
        if (!cancelled) {
          setTheme(t)
          setPhotoBg(bg)
        }
      })
    }

    // Art Zine：成品图已由生成服务返回，直接使用，不再走 Canvas 模板
    if (isArtZine) {
      setExported(artZineUrl)
      setExporting(false)
      return () => {
        cancelled = true
      }
    }

    setExporting(true)
    exportStoryImage({
      photos: renderPhotos,
      story,
      templateId,
      caption,
      companionEmoji: companionObj?.emoji,
      momentEmoji: momentObj?.emoji,
    }).then((url) => {
      if (!cancelled) {
        setExported(url)
        setExporting(false)
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 下载图片（Art Zine 为 JPEG，兜底模板为 PNG）
  const download = () => {
    if (!exported) return
    const ext = exported.startsWith('data:image/jpeg') ? 'jpg' : 'png'
    const a = document.createElement('a')
    a.href = exported
    a.download = `dining-memory-${Date.now()}.${ext}`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  // 复制到剪贴板（用于粘贴到 Instagram）
  const copyToClipboard = async () => {
    if (!exported) return
    try {
      const blob = await (await fetch(exported)).blob()
      const type = blob.type || 'image/png'
      await navigator.clipboard.write([
        new ClipboardItem({ [type]: blob }),
      ])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      download()
    }
  }

  // 分享到 Instagram（打开分享面板）
  const shareToInstagram = async () => {
    if (navigator.share && exported) {
      try {
        const blob = await (await fetch(exported)).blob()
        const file = new File([blob], 'dining-memory.jpg', { type: 'image/jpeg' })
        await navigator.share({ files: [file], title: '我的餐饮记忆' })
        return
      } catch {
        // 用户取消或失败，回退下载
      }
    }
    download()
  }

  const css = theme
    ? {
        '--bg-glow': theme.glow,
        '--bg-accent': theme.accent,
        '--bg-mid': theme.mid,
        '--bg-deep': theme.deep,
      }
    : {}

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-beige-100">
      {/* 动态氛围背景 */}
      {photoBg && (
        <div className="memory-photo-bg" style={{ backgroundImage: `url(${photoBg})` }} />
      )}
      <div className="memory-bg absolute inset-0" style={css} />

      <div className="relative z-10 flex flex-1 flex-col items-center px-5 pt-6">
        {/* 情感化完成提示 */}
        <div className="glass-light flex items-center gap-2 rounded-full px-4 py-2 text-coffee-600 animate-pop">
          <Icon name="check" size={16} className="text-sky-500" />
          <span className="text-sm font-medium">
            {isArtZine ? '今晚，被装订成了一页' : '这一晚，已被你珍藏'}
          </span>
        </div>

        {/* 分享图预览（Hero-first 收藏卡） */}
        <div className="relative mt-6 w-full max-w-[300px]">
          <div className="keepsake-card rotate-[-1deg] overflow-hidden rounded-[1.6rem] p-2">
            {exporting || !exported ? (
              <div className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-4 rounded-[1.2rem]"
                style={{ background: 'linear-gradient(180deg,#f7f0e3,#efe4d0)' }}>
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-coffee-400/20 border-t-coffee-500" />
                <p className="text-sm text-coffee-500">正在合成你的记忆…</p>
              </div>
            ) : (
              <img src={exported} alt="生成的记忆收藏卡" className="aspect-[9/16] w-full rounded-[1.2rem] object-cover" />
            )}
          </div>
        </div>

        {/* 操作区 */}
        <div className="glass glass-highlight mt-6 w-full max-w-[300px] rounded-3xl p-4">
          <PrimaryButton onClick={shareToInstagram} className="w-full" icon="download">
            保存 / 分享到 Instagram
          </PrimaryButton>
          <div className="mt-3 flex gap-3">
            <GhostButton onClick={copyToClipboard} className="flex-1" icon="check">
              {copied ? '已复制' : '复制图片'}
            </GhostButton>
            <GhostButton onClick={download} className="flex-1" icon="download">
              下载原图
            </GhostButton>
          </div>
        </div>

        {/* 提示 */}
        <p className="editorial-body mt-4 max-w-xs text-center text-[11px] text-coffee-400">
          打开 Instagram，新建 Story，粘贴或上传这张图片，
          <br />
          把这一晚，分享给值得的人。
        </p>
      </div>

      {/* 底部：重新开始 */}
      <div className="relative z-10 px-6 pb-6">
        <button
          type="button"
          onClick={onRestart}
          className="mx-auto flex items-center gap-2 text-sm text-coffee-400 transition-colors hover:text-coffee-600"
        >
          <Icon name="retake" size={15} />
          再收藏一次
        </button>
        <BottomSafe />
      </div>
    </div>
  )
}

// 选出 Hero 照片（兼容新旧结构：新结构用 url，旧结构用 src）
function pickHeroPhoto(photos) {
  const src = (p) => p?.url || p?.src || null
  return (
    photos.find((p) => p && p.type === 'dish' && src(p)) ||
    photos.find((p) => p && p.role === 'hero' && src(p)) ||
    photos.find((p) => p && src(p)) ||
    null
  )
}
