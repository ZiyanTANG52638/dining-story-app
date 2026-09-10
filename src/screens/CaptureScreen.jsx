// 相机拍照流程 —— Sonho Kitchen 暖色手作风格
//
// 构图原则：1 张 Hero（主角）+ 2 张支持照片（Memory Snapshots）
//   - 第二张"招牌时刻"是 Hero，引导时视觉强调
//   - 不鼓励等权构图
import { useEffect, useState } from 'react'
import { PHOTO_STEPS } from '../data/photos'
import { useCamera } from '../hooks/useCamera'
import { analyzePhoto } from '../lib/aiAnalysis'
import { enhanceImage, createDemoPhoto } from '../lib/imageEnhance'
import { buildMemoryTheme, makeBlurredBg } from '../lib/visuals'
import Icon from '../components/Icon'
import { PrimaryButton, GhostButton, BottomSafe } from '../components/ui'

// 章节内部状态机
const PHASE = {
  GUIDE: 'guide', // 拍摄引导
  CAMERA: 'camera', // 取景中
  ANALYZING: 'analyzing', // AI 分析中
  REVIEW: 'review', // 增强后确认
}

export default function CaptureScreen({ onComplete, onExit, initialPhotos = [] }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [phase, setPhase] = useState(PHASE.GUIDE)
  const [photos, setPhotos] = useState(initialPhotos) // [{src, enhanced, analysis}]
  const [analysis, setAnalysis] = useState(null)
  const [enhancedSrc, setEnhancedSrc] = useState(null)
  const [enhancing, setEnhancing] = useState(false)
  const [cameraDenied, setCameraDenied] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [theme, setTheme] = useState(null) // 动态色彩主题
  const [photoBg, setPhotoBg] = useState(null) // 模糊照片背景

  const camera = useCamera()
  const step = PHOTO_STEPS[stepIndex]
  const isLast = stepIndex === PHOTO_STEPS.length - 1
  const isHero = step.role === 'hero'

  // 进入相机阶段时启动摄像头
  useEffect(() => {
    if (phase === PHASE.CAMERA && !demoMode) {
      camera.start().then(() => {
        if (camera.error) setCameraDenied(true)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, demoMode])

  // 离开相机阶段时停止
  useEffect(() => {
    if (phase !== PHASE.CAMERA) camera.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // 拍摄引导 → 相机
  const goCamera = () => {
    setPhase(PHASE.CAMERA)
    setCameraDenied(false)
  }

  // 使用演示照片（无相机环境）
  const useDemo = () => {
    setDemoMode(true)
    setPhase(PHASE.CAMERA)
  }

  // 拍照
  const takePhoto = async () => {
    let src = camera.capture()
    if (!src) {
      src = createDemoPhoto(step.id)
    }
    await processPhoto(src)
  }

  // 处理一张照片：提取氛围 → AI 分析 → 增强
  const processPhoto = async (src) => {
    setPhase(PHASE.ANALYZING)
    setAnalysis(null)
    setEnhancedSrc(null)

    // 提取动态色彩与模糊背景（暖色氛围）
    const [t, bg] = await Promise.all([buildMemoryTheme(src), makeBlurredBg(src)])
    setTheme(t)
    setPhotoBg(bg)

    // 1. AI 分析（正向建议）
    const result = await analyzePhoto(src, step.id)
    setAnalysis(result)

    // 2. 自动增强
    setEnhancing(true)
    const enhanced = await enhanceImage(src, result.enhance)
    setEnhancedSrc(enhanced)
    setEnhancing(false)

    setPhase(PHASE.REVIEW)
  }

  // 确认这张照片
  const confirmPhoto = () => {
    const newPhotos = [...photos]
    newPhotos[stepIndex] = {
      src: enhancedSrc,
      raw: enhancedSrc,
      analysis,
      stepId: step.id,
      role: step.role,
    }
    setPhotos(newPhotos)

    if (isLast) {
      onComplete(newPhotos)
    } else {
      setStepIndex(stepIndex + 1)
      setPhase(PHASE.GUIDE)
      setAnalysis(null)
      setEnhancedSrc(null)
      setTheme(null)
      setPhotoBg(null)
    }
  }

  // 重拍
  const retake = () => {
    setPhase(PHASE.CAMERA)
    setAnalysis(null)
    setEnhancedSrc(null)
  }

  // 返回上一章（若已有照片）
  const goBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1)
      setPhase(PHASE.GUIDE)
    } else {
      onExit()
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-beige-100">
      {/* 顶部：进度 + 返回 */}
      <div className="relative z-20 px-5 pt-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            className="glass flex h-10 w-10 items-center justify-center rounded-full text-coffee-500 transition-colors hover:text-coffee-600"
            aria-label="返回"
          >
            <Icon name="back" size={20} />
          </button>
          <ChapterDots current={stepIndex} total={PHOTO_STEPS.length} />
          <div className="h-10 w-10" />
        </div>
      </div>

      {/* 主体内容 */}
      <div className="relative z-10 flex flex-1 flex-col">
        {phase === PHASE.GUIDE && (
          <GuideView step={step} stepIndex={stepIndex} isHero={isHero} onStart={goCamera} onDemo={useDemo} />
        )}

        {phase === PHASE.CAMERA && (
          <CameraView
            camera={camera}
            step={step}
            isHero={isHero}
            onCapture={takePhoto}
            onDenied={() => setCameraDenied(true)}
            cameraDenied={cameraDenied}
            onUseDemo={useDemo}
            demoMode={demoMode}
          />
        )}

        {phase === PHASE.ANALYZING && (
          <AnalyzingView enhancing={enhancing} theme={theme} photoBg={photoBg} />
        )}

        {phase === PHASE.REVIEW && (
          <ReviewView
            analysis={analysis}
            enhancedSrc={enhancedSrc}
            theme={theme}
            photoBg={photoBg}
            onConfirm={confirmPhoto}
            onRetake={retake}
            isLast={isLast}
            isHero={isHero}
          />
        )}
      </div>
      <BottomSafe />
    </div>
  )
}

// ---- 章节进度（顶部分段条，暖色） ----
function ChapterDots({ current, total }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-500 ${
            i === current ? 'w-6 bg-coffee-500' : i < current ? 'w-4 bg-coffee-400/60' : 'w-4 bg-coffee-300/30'
          }`}
        />
      ))}
    </div>
  )
}

// ---- 拍摄引导视图（暖色手作 + Hero 强调） ----
function GuideView({ step, stepIndex, isHero, onStart, onDemo }) {
  return (
    <div className="flex flex-1 flex-col px-6 pt-6 animate-fade-in">
      {/* 章节氛围大图 */}
      <div className={`relative mx-auto w-full max-w-sm overflow-hidden rounded-[1.8rem] ${isHero ? 'aspect-[4/5]' : 'aspect-[4/3]'}`}>
        <div className="absolute inset-0" style={{ background: guideBg(step.id) }} />
        <div className="absolute inset-0 bg-gradient-to-t from-beige-200/70 via-transparent to-transparent" />
        {/* 章节标签 */}
        <div className="glass-light absolute left-4 top-4 flex items-center gap-2 rounded-full px-3 py-1.5">
          <Icon name={step.icon} size={14} className="text-coffee-500" />
          <span className="text-xs font-medium text-coffee-600">{step.chapter}</span>
        </div>
        {/* Hero 徽章 */}
        {isHero && (
          <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-sky-400/90 px-3 py-1.5 text-beige-50">
            <Icon name="dish" size={13} />
            <span className="text-xs font-semibold">Hero 主角镜头</span>
          </div>
        )}
        {/* 中央情感文案 */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h2 className="story-display text-3xl text-coffee-600">{step.title}</h2>
          <p className="mt-1 text-sm text-coffee-500/80">{step.subtitle}</p>
        </div>
      </div>

      {/* 引导语 */}
      <p className="story-display mx-auto mt-7 max-w-xs text-center text-lg leading-relaxed text-coffee-600">
        {step.prompt}
      </p>

      {/* 摄影小贴士（暖色玻璃） */}
      <div className="mx-auto mt-6 w-full max-w-sm space-y-2.5">
        {step.tips.map((tip, i) => (
          <div
            key={i}
            className="glass flex items-start gap-3 rounded-2xl px-4 py-3"
          >
            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${isHero ? 'bg-sky-400/25 text-sky-500' : 'bg-coffee-500/15 text-coffee-500'}`}>
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-coffee-500">{tip}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-auto w-full max-w-sm space-y-3 pb-6 pt-8">
        <PrimaryButton onClick={onStart} className="w-full" icon="camera">
          {isHero ? '拍下今晚的主角' : stepIndex === 0 ? '拍下第一幕氛围' : '拍下这一章'}
        </PrimaryButton>
        <GhostButton onClick={onDemo} className="w-full">
          用示例照片体验
        </GhostButton>
      </div>
    </div>
  )
}

function guideBg(id) {
  const map = {
    'first-impression': 'linear-gradient(160deg,#efe4d0,#e5d5ba 55%,#d6bf9c 130%)',
    'signature-moment': 'linear-gradient(160deg,#e5d0ae,#c9a06a 55%,#b08a6a 130%)',
    'memory-moment': 'linear-gradient(160deg,#e8e2d8,#d7e6ec 55%,#bcd6e2 130%)',
  }
  return map[id] || map['signature-moment']
}

// ---- 相机取景视图（Hero 强调取景框） ----
function CameraView({ camera, step, isHero, onCapture, cameraDenied, onUseDemo, demoMode }) {
  const { videoRef, flip } = camera
  return (
    <div className="flex flex-1 flex-col px-4 pt-3">
      {/* 章节提示条 */}
      <div className="glass mx-auto mb-3 flex items-center gap-2 rounded-full px-4 py-2 text-coffee-600">
        <Icon name={step.icon} size={15} className="text-coffee-500" />
        <span className="text-[13px]">{step.prompt}</span>
        {isHero && (
          <span className="ml-1 rounded-full bg-sky-400/90 px-2 py-0.5 text-[10px] font-semibold text-beige-50">Hero</span>
        )}
      </div>

      {/* 全屏取景框 */}
      <div className={`relative mx-auto w-full max-w-sm overflow-hidden rounded-[1.8rem] bg-beige-200 shadow-xl shadow-coffee-500/15 ${isHero ? 'aspect-[3/4]' : 'aspect-[3/4]'}`}>
        {!cameraDenied && !demoMode ? (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center"
            style={{ background: guideBg(step.id) }}>
            <div className="glass-light flex h-16 w-16 items-center justify-center rounded-full">
              <Icon name="camera" size={30} className="text-coffee-500" />
            </div>
            <p className="text-sm text-coffee-600">
              {demoMode
                ? '示例模式 · 将生成演示照片'
                : '无法访问相机，可切换为示例照片体验完整流程'}
            </p>
            {!demoMode && (
              <button
                type="button"
                onClick={onUseDemo}
                className="glass mt-2 rounded-full px-5 py-2 text-sm text-coffee-500"
              >
                使用示例照片
              </button>
            )}
          </div>
        )}

        {/* 取景框装饰：Hero 用天蓝聚焦框，其余用咖啡细框 */}
        <div className={`pointer-events-none absolute inset-4 rounded-3xl border ${isHero ? 'border-sky-400/70' : 'border-coffee-400/30'}`} />
        {isHero && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sky-400/70" />
        )}
        {/* 底部渐隐 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-beige-200/60 to-transparent" />
      </div>

      {/* 底部控制 */}
      <div className="mt-auto flex items-center justify-center gap-10 pb-6 pt-6">
        <button
          type="button"
          onClick={flip}
          className="glass flex h-12 w-12 items-center justify-center rounded-full text-coffee-500 transition-colors hover:text-coffee-600"
          aria-label="切换摄像头"
        >
          <Icon name="flip" size={22} />
        </button>

        <button
          type="button"
          onClick={onCapture}
          className="group relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full"
          aria-label="拍照"
        >
          <span className={`absolute inset-0 rounded-full border-2 transition-transform group-active:scale-90 ${isHero ? 'border-sky-400' : 'border-coffee-500/70'}`} />
          <span className={`h-[3.4rem] w-[3.4rem] rounded-full shadow-lg transition-transform group-active:scale-90 ${isHero ? 'bg-gradient-to-br from-sky-400 to-sky-500 shadow-sky-400/30' : 'bg-gradient-to-br from-coffee-400 to-coffee-600 shadow-coffee-500/30'}`} />
        </button>

        <div className="h-12 w-12" />
      </div>
    </div>
  )
}

// ---- AI 分析中视图（暖色动态氛围） ----
function AnalyzingView({ enhancing, theme, photoBg }) {
  const css = theme
    ? {
        '--bg-glow': theme.glow,
        '--bg-accent': theme.accent,
        '--bg-mid': theme.mid,
        '--bg-deep': theme.deep,
      }
    : {}
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-8 text-center animate-fade-in">
      {/* 动态氛围背景 */}
      {photoBg && (
        <div className="memory-photo-bg" style={{ backgroundImage: `url(${photoBg})` }} />
      )}
      <div className="memory-bg absolute inset-0" style={css} />

      <div className="relative z-10 flex flex-col items-center">
        <div className="glass glass-highlight relative mb-8 flex h-28 w-28 items-center justify-center rounded-full">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-coffee-400/20 border-t-coffee-500" />
          <Icon name="sparkles" size={38} className="text-coffee-500" />
        </div>
        <h3 className="story-display text-2xl text-coffee-600">
          {enhancing ? '正在温柔修片…' : 'AI 正在读懂这一刻…'}
        </h3>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-coffee-500">
          {enhancing
            ? '自动调整光线与色彩，让画面更出彩'
            : '感受氛围、光线与构图，为你送上正向建议'}
        </p>
      </div>
    </div>
  )
}

// ---- 增强后确认视图（暖色 + Hero 强调） ----
function ReviewView({ analysis, enhancedSrc, theme, photoBg, onConfirm, onRetake, isLast, isHero }) {
  const css = theme
    ? {
        '--bg-glow': theme.glow,
        '--bg-accent': theme.accent,
        '--bg-mid': theme.mid,
        '--bg-deep': theme.deep,
      }
    : {}
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden px-5 pt-3 animate-fade-in">
      {/* 动态氛围背景 */}
      {photoBg && (
        <div className="memory-photo-bg" style={{ backgroundImage: `url(${photoBg})` }} />
      )}
      <div className="memory-bg absolute inset-0" style={css} />

      <div className="relative z-10 flex flex-1 flex-col">
        {/* 增强后照片 */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className={`photo-card w-full ${isHero ? 'aspect-[3/4]' : 'aspect-[3/4]'} rotate-[-1deg]`}>
            <img src={enhancedSrc} alt="增强后的照片" />
            {/* 滤镜标签 */}
            <div className="glass-light absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5">
              <Icon name="sparkles" size={13} className="text-coffee-500" />
              <span className="text-xs font-medium text-coffee-600">AI 已温柔优化</span>
            </div>
            {isHero && (
              <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-sky-400/90 px-2.5 py-1 text-beige-50">
                <Icon name="dish" size={12} />
                <span className="text-[11px] font-semibold">Hero</span>
              </div>
            )}
          </div>
        </div>

        {/* 正向 AI 反馈 */}
        {analysis && (
          <div className="glass glass-highlight mx-auto mt-5 w-full max-w-sm rounded-3xl p-4 animate-pop">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-coffee-600">
              <Icon name="sparkle" size={15} />
              {analysis.opener}
            </p>
            <ul className="space-y-1.5">
              {analysis.suggestions.slice(0, 2).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-coffee-500">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-400" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="mx-auto mt-auto flex w-full max-w-sm gap-3 pb-6 pt-5">
          <GhostButton onClick={onRetake} icon="retake" className="flex-1">
            重拍
          </GhostButton>
          <PrimaryButton onClick={onConfirm} className="flex-[1.6]" icon="arrow">
            {isLast ? '完成记录' : '下一幕'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
