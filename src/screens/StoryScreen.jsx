// 记忆创作 —— Sonho Kitchen 暖色手作风格
//
// 产品主流程（Art Zine 为核心）：
//   Capture moments → Create Art Zine → Share memory
//
// 用户不再选择版式。系统用用户自己拍摄的三张照片，
// 编排成 1080×1920 的一页作品（Art Zine 艺术纸刊）。
//
// 01–03 确定性模板（Editorial / Memory Collage / Classic）保留为
// 兜底与「换一种收藏方式」，但不再是主选择入口。
import { useState } from 'react'
import { COMPANION_OPTIONS, FAVORITE_MOMENT_OPTIONS, RESTAURANT } from '../data/photos'
import { generateStory } from '../lib/storyGenerator'
import { buildMemoryTheme, makeBlurredBg } from '../lib/visuals'
import { DEFAULT_TEMPLATE_ID, getTemplate, TEXT_LIMITS } from '../lib/templates'
import { recommendTemplate, generateShortCaption } from '../lib/aiModules'
import { segmentSubject } from '../lib/segmentSubject'
import { normalizePhotos } from '../lib/photoNormalize'
import { generateArtZine } from '../lib/artZine'
import { pickArtZinePhrase } from '../lib/artZineCopy'
import StoryPreview from '../components/StoryPreview'
import ArtZineCanvas from '../components/ArtZineCanvas'
import ArtZineScreen from './ArtZineScreen'
import Icon from '../components/Icon'
import { PrimaryButton, BottomSafe } from '../components/ui'

const PHASE = {
  SELECT: 'select', // 情感化选择（谁陪你 / 最难忘瞬间）
  ART_ZINE: 'art-zine', // 艺术纸刊：过渡屏（正在重新整理今晚的三个瞬间）
  ART_ZINE_RESULT: 'art-zine-result', // 艺术纸刊：结果屏（今晚，被装订成了一页）
  EDIT: 'edit', // 兜底：换一种收藏方式（01–03 确定性模板）
}

export default function StoryScreen({ photos, onBack, onComplete }) {
  const [phase, setPhase] = useState(PHASE.SELECT)
  const [companion, setCompanion] = useState(null)
  const [favoriteMoment, setFavoriteMoment] = useState(null)
  const [story, setStory] = useState(null)
  const [editable, setEditable] = useState(null)
  const [theme, setTheme] = useState(null)
  const [photoBg, setPhotoBg] = useState(null)
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID)
  const [caption, setCaption] = useState('')
  const [heroCutout, setHeroCutout] = useState(null)
  // 归一化照片（兜底模板共用同一份数据：比例 / 方向 / 焦点 / 主色）
  const [normalizedPhotos, setNormalizedPhotos] = useState([])
  // Art Zine 状态
  const [artZine, setArtZine] = useState(null) // { url, source, meta }
  const [artZineError, setArtZineError] = useState(false)
  const [artZinePhrase, setArtZinePhrase] = useState('')

  // 收集所有识别到的菜品
  const allDishes = photos.map((p) => p.analysis?.detectedDishes || []).flat()

  // 主流程：回答两个小问题 → 直接进入 Art Zine 创作
  // （用户不选择版式，系统用他自己的三张照片编排成作品）
  const handleGenerate = async () => {
    // 提取氛围（用 Hero 照片）
    const hero = pickHeroPhoto(photos)
    if (hero) {
      const [t, bg] = await Promise.all([buildMemoryTheme(hero.src), makeBlurredBg(hero.src)])
      setTheme(t)
      setPhotoBg(bg)
    }
    const result = await generateStory({
      companion,
      favoriteMoment,
      dishes: allDishes,
      photoCount: photos.length,
    })
    setStory(result)
    setEditable(result.editable)

    // 归一化照片（兜底模板使用；Art Zine 直接用原始照片）
    const normalized = await normalizePhotos(photos)
    setNormalizedPhotos(normalized)

    // 生成短文案（无 API 时走 mock）
    const cap = await generateShortCaption({ favoriteMoment, dishes: allDishes })
    setCaption(cap)

    // 进入 Art Zine 创作流程
    setArtZine(null)
    setArtZineError(false)
    setArtZinePhrase(pickArtZinePhrase())
    setPhase(PHASE.ART_ZINE)
  }

  // Art Zine 过渡屏结束 → 用用户真实照片渲染成品
  const handleArtZineCompose = async () => {
    try {
      const result = await generateArtZine({
        // 直接使用用户拍摄的照片（统一结构 { url, type, focalPoint }）
        photos,
        restaurant: RESTAURANT,
        memoryText: artZinePhrase,
      })
      setArtZine(result)
      setArtZineError(false)
      setPhase(PHASE.ART_ZINE_RESULT)
    } catch {
      // 生成失败：绝不留下空白，展示兜底入口
      setArtZineError(true)
      setPhase(PHASE.ART_ZINE_RESULT)
    }
  }

  // 兜底：Art Zine 失败时回退到经典收藏（01–03 确定性模板）
  const handleArtZineFallback = async () => {
    setArtZineError(false)
    setArtZine(null)
    setTemplateId('classic')
    // 兜底模板需要归一化照片与抠图
    if (!normalizedPhotos.length) {
      const normalized = await normalizePhotos(photos)
      setNormalizedPhotos(normalized)
    }
    setPhase(PHASE.EDIT)
  }

  // 「换一种收藏方式」：从 Art Zine 结果回到确定性模板（兜底路径）
  const handleSwitchToTemplates = async () => {
    if (!normalizedPhotos.length) {
      const normalized = await normalizePhotos(photos)
      setNormalizedPhotos(normalized)
    }
    const rec = await recommendTemplate(photos)
    setTemplateId(rec)
    if (rec === 'collage' && !heroCutout) {
      const heroPhoto = pickHeroPhoto(photos)
      if (heroPhoto) {
        const cut = await segmentSubject(heroPhoto)
        setHeroCutout(cut)
      }
    }
    setPhase(PHASE.EDIT)
  }

  // 兜底模板内切换时按需准备抠图（保证预览与导出一致）
  const handleTemplateChange = async (id) => {
    setTemplateId(id)
    if (id === 'collage' && !heroCutout) {
      const heroPhoto = pickHeroPhoto(photos)
      if (heroPhoto) {
        const cut = await segmentSubject(heroPhoto)
        setHeroCutout(cut)
      }
    }
  }

  // 编辑字段
  const updateField = (key, value) => {
    setEditable((prev) => ({ ...prev, [key]: value }))
  }

  // 应用编辑，构建最终 story（同步返回，供导出使用）
  const buildFinalStory = () => {
    if (!story || !editable) return story
    return {
      ...story,
      headline: editable.headline,
      companion: editable.companion,
      favoriteMoment: editable.momentText,
      body: `在${story.restaurant}，我们分享了${editable.enjoyedText}。最难忘的是${editable.momentText}。`,
      editable,
      templateId,
      caption,
      // 归一化照片随 story 传递，保证导出与预览使用同一份数据
      normalizedPhotos,
      // Art Zine 成品图（由用户真实照片本地渲染）
      artZineUrl: artZine?.url || null,
      artZineSource: artZine?.source || null,
      artZinePhrase,
    }
  }

  const companionObj = COMPANION_OPTIONS.find((c) => c.id === companion)
  const momentObj = FAVORITE_MOMENT_OPTIONS.find((m) => m.id === favoriteMoment)

  // 返回逻辑：Art Zine 结果 → 回到选择；兜底编辑 → 回到选择；其余 → 退出
  const handleBack = () => {
    if (phase === PHASE.ART_ZINE_RESULT) {
      setPhase(PHASE.SELECT)
      return
    }
    if (phase === PHASE.EDIT) {
      setPhase(PHASE.SELECT)
      return
    }
    onBack()
  }

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-beige-100">
      {/* 顶部返回 */}
      <div className="relative z-20 px-5 pt-5">
        <button
          type="button"
          onClick={handleBack}
          className="glass flex h-10 w-10 items-center justify-center rounded-full text-coffee-500 transition-colors hover:text-coffee-600"
          aria-label="返回"
        >
          <Icon name="back" size={20} />
        </button>
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        {phase === PHASE.SELECT && (
          <SelectView
            photos={photos}
            companion={companion}
            setCompanion={setCompanion}
            favoriteMoment={favoriteMoment}
            setFavoriteMoment={setFavoriteMoment}
            onGenerate={handleGenerate}
            canGenerate={!!companion && !!favoriteMoment}
          />
        )}

        {phase === PHASE.ART_ZINE && (
          <ArtZineScreen onDone={handleArtZineCompose} onFallback={handleArtZineFallback} />
        )}

        {phase === PHASE.ART_ZINE_RESULT && (
          <ArtZineResultView
            url={artZine?.url}
            error={artZineError}
            phrase={artZinePhrase}
            onFallback={handleArtZineFallback}
            onSwitchToTemplates={handleSwitchToTemplates}
            onDone={() => onComplete(buildFinalStory(), companionObj, momentObj)}
          />
        )}

        {phase === PHASE.EDIT && story && (
          <EditView
            story={story}
            editable={editable}
            updateField={updateField}
            photos={photos}
            theme={theme}
            photoBg={photoBg}
            companionEmoji={companionObj?.emoji}
            momentEmoji={momentObj?.emoji}
            templateId={templateId}
            setTemplateId={handleTemplateChange}
            caption={caption}
            setCaption={setCaption}
            heroCutout={heroCutout}
            normalizedPhotos={normalizedPhotos}
            onDone={() => {
              onComplete(buildFinalStory(), companionObj, momentObj)
            }}
          />
        )}
      </div>
      <BottomSafe />
    </div>
  )
}

// 选出 Hero 照片（type === 'dish' 优先，否则 role === 'hero'，否则取第一张）
// 兼容新旧结构：新结构用 url，旧结构用 src
function pickHeroPhoto(photos) {
  const src = (p) => p?.url || p?.src || null
  return (
    photos.find((p) => p && p.type === 'dish' && src(p)) ||
    photos.find((p) => p && p.role === 'hero' && src(p)) ||
    photos.find((p) => p && src(p)) ||
    null
  )
}

// ---- 情感化选择视图 ----
function SelectView({
  photos,
  companion,
  setCompanion,
  favoriteMoment,
  setFavoriteMoment,
  onGenerate,
  canGenerate,
}) {
  const heroPhoto = pickHeroPhoto(photos)
  const hero = heroPhoto?.url || heroPhoto?.src
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden animate-fade-in">
      {/* 柔和氛围背景 */}
      {hero && (
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="memory-photo-bg" style={{ backgroundImage: `url(${hero})` }} />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-beige-100/80 via-beige-100/50 to-beige-100" />

      <div className="relative z-10 flex flex-1 flex-col px-6 pt-4">
        {/* 情感化标题 */}
        <div className="text-center">
          <div className="mb-2 flex justify-center text-coffee-400">
            <Icon name="sparkles" size={24} />
          </div>
          <h2 className="story-display text-[1.7rem] leading-snug text-coffee-600">
            把今晚
            <br />
            装订成<span className="text-gradient-gold">一页</span>
          </h2>
          <p className="editorial-body mx-auto mt-2 max-w-[16rem] text-sm text-coffee-400">
            回答两个小问题，我们会用你的三张照片
            <br />
            编排成一张只属于今晚的作品
          </p>
        </div>

        {/* 陪伴对象 */}
        <div className="mt-8">
          <p className="story-display mb-3 text-base text-coffee-600">
            谁陪你度过了这一晚？
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            {COMPANION_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setCompanion(opt.id)}
                className={`flex shrink-0 flex-col items-center gap-2 rounded-3xl px-5 py-4 transition-all duration-300 ${
                  companion === opt.id
                    ? 'glass-strong border-coffee-500/50 text-coffee-600 shadow-lg shadow-coffee-500/10'
                    : 'glass text-coffee-400 hover:text-coffee-600'
                }`}
              >
                <span className="text-3xl">{opt.emoji}</span>
                <span className="text-sm whitespace-nowrap">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 难忘瞬间 */}
        <div className="mt-6">
          <p className="story-display mb-3 text-base text-coffee-600">
            最想留住的是哪个瞬间？
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            {FAVORITE_MOMENT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFavoriteMoment(opt.id)}
                className={`flex shrink-0 flex-col items-center gap-2 rounded-3xl px-5 py-4 transition-all duration-300 ${
                  favoriteMoment === opt.id
                    ? 'glass-strong border-coffee-500/50 text-coffee-600 shadow-lg shadow-coffee-500/10'
                    : 'glass text-coffee-400 hover:text-coffee-600'
                }`}
              >
                <span className="text-3xl">{opt.emoji}</span>
                <span className="text-sm whitespace-nowrap">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pb-6 pt-8">
          <PrimaryButton
            onClick={onGenerate}
            disabled={!canGenerate}
            className="w-full"
            icon="sparkles"
          >
            装订今晚这一页
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

// ---- 润色记忆卡片视图（兜底：01–03 确定性模板 + 9:16 实时预览） ----
function EditView({
  story,
  editable,
  updateField,
  photos,
  theme,
  photoBg,
  companionEmoji,
  momentEmoji,
  templateId,
  setTemplateId,
  caption,
  setCaption,
  heroCutout,
  normalizedPhotos,
  onDone,
}) {
  const css = theme
    ? {
        '--bg-glow': theme.glow,
        '--bg-accent': theme.accent,
        '--bg-mid': theme.mid,
        '--bg-deep': theme.deep,
      }
    : {}
  const activeTemplate = getTemplate(templateId)

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden animate-fade-in">
      {/* 动态氛围背景 */}
      {photoBg && (
        <div className="memory-photo-bg" style={{ backgroundImage: `url(${photoBg})` }} />
      )}
      <div className="memory-bg absolute inset-0" style={css} />

      <div className="relative z-10 flex flex-1 flex-col px-5 pt-2">
        {/* 标题：换一种收藏方式（兜底路径，非主流程） */}
        <div className="text-center">
          <div className="mb-1 flex justify-center text-coffee-400">
            <Icon name="sparkles" size={20} />
          </div>
          <h2 className="story-display text-[1.35rem] text-coffee-600">换一种收藏方式</h2>
          <p className="editorial-body mt-1 text-xs text-coffee-400">
            同样的三张照片，换一种讲述方式
          </p>
        </div>

        {/* 模板切换器（横滑）：01–03 确定性模板 + 04 Art Zine 生成式模式 */}
        <div className="template-switcher mt-4">
          {SELECTOR_CARDS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplateId(t.id)}
              className={`template-chip ${templateId === t.id ? 'template-chip--active' : ''} ${
                t.sparkle ? 'template-chip--zine' : ''
              }`}
            >
              <span className="template-chip__index">
                {t.index}
                {t.sparkle && (
                  <span className="template-chip__sparkle">
                    <Icon name="sparkle" size={11} />
                  </span>
                )}
              </span>
              <span className="template-chip__name">{t.name}</span>
              <span className="template-chip__desc">{t.nameZh}</span>
            </button>
          ))}
        </div>

        {/* 选择器说明（不提及 AI） */}
        <p className="mt-2 text-center text-[0.68rem] leading-relaxed text-coffee-300">
          {TEMPLATE_SELECTOR_NOTE}
        </p>

        {/* 9:16 实时预览（视觉中心，所见即所得） */}
        <div className="mt-4">
          <StoryPreview
            photos={normalizedPhotos.length ? normalizedPhotos : photos}
            story={story}
            templateId={templateId}
            caption={caption}
            heroCutout={heroCutout}
          />
        </div>

        {/* 短文案编辑（编辑式，无表单感；严格限长，绝不改变布局） */}
        <div className="mx-auto mt-4 w-full max-w-sm">
          <div className="caption-field">
            <Icon name="sparkle" size={14} className="shrink-0 text-coffee-400" />
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={activeTemplate.caption}
              maxLength={TEXT_LIMITS.memory}
            />
            <span className="shrink-0 text-[0.65rem] tabular-nums text-coffee-300">
              {caption.length}/{TEXT_LIMITS.memory}
            </span>
          </div>
        </div>

        <div className="mx-auto mt-auto w-full max-w-sm pb-6 pt-5">
          <PrimaryButton onClick={onDone} className="w-full" icon="arrow">
            生成分享记忆
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

// ---- Art Zine 结果视图 ----
// 展示「被编排的一页」：用户照片渲染的成品图 + 主短句 + 兜底入口
function ArtZineResultView({ url, error, phrase, onFallback, onSwitchToTemplates, onDone }) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden animate-fade-in">
      <div className="relative z-10 flex flex-1 flex-col px-5 pt-2">
        {/* 标题 */}
        <div className="text-center">
          <div className="mb-1 flex justify-center text-coffee-400">
            <Icon name="sparkles" size={20} />
          </div>
          <h2 className="story-display text-[1.35rem] text-coffee-600">今晚，被装订成了一页</h2>
          <p className="editorial-body mt-1 text-xs text-coffee-400">
            这一页只属于今晚，不会重复
          </p>
        </div>

        {/* 成品图（或兜底） */}
        <div className="mt-4">
          <ArtZineCanvas url={url} error={error} onFallback={onFallback} />
        </div>

        {/* 主短句（≤12 字） */}
        {!error && phrase ? (
          <p className="art-zine-phrase mt-4 text-center">{phrase}</p>
        ) : null}

        {/* 操作区 */}
        <div className="mx-auto mt-auto w-full max-w-sm pb-6 pt-5">
          {error ? (
            <PrimaryButton onClick={onFallback} className="w-full" icon="heart">
              先保存为经典收藏
            </PrimaryButton>
          ) : (
            <>
              <PrimaryButton onClick={onDone} className="w-full" icon="arrow">
                生成分享记忆
              </PrimaryButton>
              <button
                type="button"
                onClick={onSwitchToTemplates}
                className="mx-auto mt-3 flex items-center gap-2 text-xs text-coffee-400 transition-colors hover:text-coffee-600"
              >
                <Icon name="back" size={13} />
                换一种收藏方式
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
