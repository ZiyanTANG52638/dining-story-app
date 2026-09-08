// AI 记忆叙事生成 —— Sonho Kitchen 暖色手作风格
//
// Hero-first 排版：Hero 照片占 60-70%，其余为 Memory Snapshots（支持而非竞争）
// 记忆卡设计成"可收藏物件"（明信片/手作卡片感）
import { useState } from 'react'
import { COMPANION_OPTIONS, FAVORITE_MOMENT_OPTIONS } from '../data/photos'
import { generateStory } from '../lib/storyGenerator'
import { buildMemoryTheme, makeBlurredBg } from '../lib/visuals'
import Icon from '../components/Icon'
import { PrimaryButton, BottomSafe } from '../components/ui'

const PHASE = {
  SELECT: 'select', // 情感化选择
  GENERATING: 'generating', // AI 生成中
  EDIT: 'edit', // 润色记忆卡片
}

export default function StoryScreen({ photos, onBack, onComplete }) {
  const [phase, setPhase] = useState(PHASE.SELECT)
  const [companion, setCompanion] = useState(null)
  const [favoriteMoment, setFavoriteMoment] = useState(null)
  const [story, setStory] = useState(null)
  const [editable, setEditable] = useState(null)
  const [theme, setTheme] = useState(null)
  const [photoBg, setPhotoBg] = useState(null)

  // 收集所有识别到的菜品
  const allDishes = photos.map((p) => p.analysis?.detectedDishes || []).flat()

  // 生成故事
  const handleGenerate = async () => {
    setPhase(PHASE.GENERATING)
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
    setPhase(PHASE.EDIT)
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
    }
  }

  const companionObj = COMPANION_OPTIONS.find((c) => c.id === companion)
  const momentObj = FAVORITE_MOMENT_OPTIONS.find((m) => m.id === favoriteMoment)

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-beige-100">
      {/* 顶部返回 */}
      <div className="relative z-20 px-5 pt-5">
        <button
          type="button"
          onClick={phase === PHASE.EDIT ? () => setPhase(PHASE.SELECT) : onBack}
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

        {phase === PHASE.GENERATING && <GeneratingView />}

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

// 选出 Hero 照片（role === 'hero' 优先，否则取第一张）
function pickHeroPhoto(photos) {
  return photos.find((p) => p && p.role === 'hero' && p.src) || photos.find((p) => p && p.src) || null
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
  const hero = pickHeroPhoto(photos)?.src
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
            让 AI 帮你
            <br />
            写下<span className="text-gradient-gold">这一晚</span>
          </h2>
          <p className="editorial-body mx-auto mt-2 max-w-[16rem] text-sm text-coffee-400">
            回答两个小问题，AI 会把你的照片
            <br />
            编织成一段值得回味的记忆
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
            写下我的记忆
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

// ---- 生成中 ----
function GeneratingView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center animate-fade-in">
      <div className="glass glass-highlight relative mb-8 flex h-28 w-28 items-center justify-center rounded-full">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-coffee-400/20 border-t-coffee-500" />
        <Icon name="heart" size={36} className="text-coffee-500" />
      </div>
      <h3 className="story-display text-2xl text-coffee-600">正在书写你的故事…</h3>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-coffee-400">
        把照片、滋味与你的选择，
        <br />
        编织成一段有温度的回忆
      </p>
    </div>
  )
}

// ---- 润色记忆卡片视图（Hero-first + 可收藏物件感） ----
function EditView({
  story,
  editable,
  updateField,
  photos,
  theme,
  photoBg,
  companionEmoji,
  momentEmoji,
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
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden animate-fade-in">
      {/* 动态氛围背景 */}
      {photoBg && (
        <div className="memory-photo-bg" style={{ backgroundImage: `url(${photoBg})` }} />
      )}
      <div className="memory-bg absolute inset-0" style={css} />

      <div className="relative z-10 flex flex-1 flex-col px-5 pt-2">
        {/* Hero-first 照片编排 */}
        <HeroLayout photos={photos} />

        {/* 可收藏记忆卡（明信片物件感） */}
        <div className="keepsake-card mx-auto mt-5 w-full max-w-sm p-6">
          {/* 顶部：柔和天蓝细线 + 标签 */}
          <div className="sky-rule mb-4 w-12" />
          <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-coffee-400">
            <Icon name="sparkle" size={12} />
            你的记忆 · 收藏卡
          </div>

          {/* 可润色的标题 */}
          <input
            value={editable.headline}
            onChange={(e) => updateField('headline', e.target.value)}
            className="story-display w-full bg-transparent text-2xl text-coffee-600 outline-none placeholder:text-coffee-300"
            placeholder="值得记住的一晚"
          />

          <div className="mt-4 space-y-3">
            <NarrativeField
              icon={companionEmoji || '👥'}
              value={editable.companion}
              onChange={(v) => updateField('companion', v)}
            />
            <NarrativeField
              icon="🍽️"
              value={editable.enjoyedText}
              onChange={(v) => updateField('enjoyedText', v)}
            />
            <NarrativeField
              icon={momentEmoji || '✨'}
              value={editable.momentText}
              onChange={(v) => updateField('momentText', v)}
            />
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-coffee-400/15 pt-3 text-xs text-coffee-400">
            <span>{story.restaurant}</span>
            <span>{story.date}</span>
            <span>📷 {story.photoCount} 幕</span>
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

// Hero-first 照片编排：Hero 大图占主导，两张 Memory Snapshots 小卡错落
function HeroLayout({ photos }) {
  const hero = pickHeroPhoto(photos)
  const snapshots = photos.filter((p) => p && p !== hero && p.src).slice(0, 2)
  if (!hero) return null

  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* Hero 大图（占主导） */}
      <div className="photo-card aspect-[4/5] w-full rotate-[-1deg]">
        <img src={hero.src} alt="Hero 主角照片" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-sky-400/90 px-3 py-1 text-beige-50">
          <Icon name="dish" size={12} />
          <span className="text-[11px] font-semibold">Hero · 今晚主角</span>
        </div>
      </div>

      {/* 两张 Memory Snapshots 小卡（错落叠放，支持而非竞争） */}
      {snapshots.length > 0 && (
        <div className="relative -mt-8 flex justify-center gap-3 px-6">
          {snapshots.map((p, i) => (
            <div
              key={i}
              className="photo-card h-20 w-16 rotate-[2deg]"
              style={{ transform: `rotate(${i === 0 ? '-3deg' : '3deg'})` }}
            >
              <img src={p.src} alt="记忆快照" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 叙事式润色字段（避免表单标签外观）
function NarrativeField({ icon, value, onChange }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-beige-100/70 px-3.5 py-2.5 focus-within:bg-beige-100">
      <span className="text-lg">{icon}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm text-coffee-600 outline-none placeholder:text-coffee-300"
      />
    </div>
  )
}
