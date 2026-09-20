// 相机拍照流程 —— Sonho Kitchen 暖色手作风格
//
// 构图原则：1 张 Hero（主角）+ 2 张支持照片（Memory Snapshots）
//   - 第二张"招牌时刻"是 Hero，引导时视觉强调
//   - 不鼓励等权构图
//
// 体验原则（记忆优先，而非点评工具）：
//   - 相机始终是视觉中心，灵感卡只是低层级的温柔提示
//   - 不评判、不说"正确拍法"、保留用户自主权
//   - 拍完后先肯定"这一刻已经留下了。"，再给一条可选建议
//   - [就用这张] 与 [再拍一个角度] 心理上同等正当
import { useEffect, useState } from 'react'
import { PHOTO_STEPS } from '../data/photos'
import { useCamera } from '../hooks/useCamera'
import { analyzePhoto } from '../lib/aiAnalysis'
import { enhanceImage, createDemoPhoto } from '../lib/imageEnhance'
import { buildMemoryTheme, makeBlurredBg } from '../lib/visuals'
import { fromCaptureStep, savePhotos } from '../lib/photoStore'
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
    // 统一照片对象结构：{ id, url, type, timestamp, focalPoint }
    // 渲染器只消费 { url, type, focalPoint }，不关心来源（相机 / 文件 / demo）
    newPhotos[stepIndex] = fromCaptureStep(step, enhancedSrc, analysis)
    setPhotos(newPhotos)
    // 会话级持久化：刷新不丢失（关闭标签页即清除）
    savePhotos(newPhotos)

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

  // 再拍一个角度（与"就用这张"心理对等）
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

// ---- 章节进度（顶部分段条 + 01 空间 / 02 主角 / 03 同行 叙事） ----
function ChapterDots({ current, total }) {
  const step = PHOTO_STEPS[current]
  return (
    <div className="flex flex-col items-center gap-1.5">
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
      {/* 进度叙事：01 空间 / 02 主角 / 03 同行（而非 1/3） */}
      <div className="flex items-center gap-1.5 text-[10px] tracking-[0.18em] text-coffee-400">
        <span className="font-medium text-coffee-500">{step.index}</span>
        <span className="text-coffee-400/80">{step.chapter}</span>
      </div>
    </div>
  )
}

// ---- 轻量摄影提醒（小字，无重容器） ----
function Reminders({ items }) {
  if (!items?.length) return null
  return (
    <ul className="mx-auto flex w-full max-w-sm flex-col items-center gap-1.5">
      {items.map((text, i) => (
        <li key={i} className="flex items-center gap-2 text-[12px] leading-relaxed text-coffee-400">
          <span className="text-coffee-300">{['①', '②', '③'][i] || '·'}</span>
          <span>{text}</span>
        </li>
      ))}
    </ul>
  )
}

// ---- 拍摄引导视图（Hero 照片即老师，界面极简） ----
function GuideView({ step, stepIndex, isHero, onStart, onDemo }) {
  return (
    <div className="flex flex-1 flex-col px-5 pt-3 animate-fade-in">
      {/* 章节 Hero：真实餐厅照片铺满，文字叠层（照片是主角） */}
      <div className="editorial-frame photo-vignette photo-bottom-gradient relative mx-auto w-full max-w-sm aspect-[4/5]">
        <img src={step.photo} alt={step.photoAlt || step.title} className="photo-warm" />
        {/* 章节标签（玻璃胶囊，仅文字背后） */}
        <div className="glass-capsule absolute left-4 top-4 flex items-center gap-2 rounded-full px-3 py-1.5">
          <Icon name={step.icon} size={14} className="text-beige-50" />
          <span className="text-xs font-medium text-beige-50 photo-text-shadow">{step.chapter}</span>
        </div>
        {/* Hero 徽章（弱化措辞，避免"正确拍法"暗示） */}
        {isHero && (
          <div className="glass-capsule-dark absolute right-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1.5">
            <Icon name="dish" size={13} className="text-beige-50" />
            <span className="text-xs font-semibold text-beige-50 photo-text-shadow">今晚的主角</span>
          </div>
        )}
        {/* 叠层文案：图 → 暖色渐变 → 文案（层级清晰，不与照片竞争） */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-[10px] tracking-[0.24em] text-beige-100/85 photo-text-shadow">{step.eyebrow}</p>
          <h2 className="story-display mt-1.5 text-3xl text-beige-50 photo-text-shadow">{step.title}</h2>
          <p className="mt-1 text-sm text-beige-100/85 photo-text-shadow">{step.subtitle}</p>
        </div>
      </div>

      {/* 一句话引导 */}
      <p className="story-display mx-auto mt-5 max-w-xs text-center text-[17px] leading-relaxed text-coffee-600">
        {step.prompt}
      </p>

      {/* 轻量摄影提醒（小字，无重容器） */}
      <div className="mt-4">
        <Reminders items={step.reminders} />
      </div>

      <div className="mx-auto mt-auto w-full max-w-sm space-y-2.5 pb-5 pt-6">
        <PrimaryButton onClick={onStart} className="w-full" icon="camera">
          {isHero ? '让这道菜成为主角' : stepIndex === 0 ? '记录今晚的空间' : '记住一起吃饭的人'}
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

// ---- 相机取景视图（相机为视觉中心，灵感卡为低层级浮层） ----
function CameraView({ camera, step, isHero, onCapture, cameraDenied, onUseDemo, demoMode }) {
  const { videoRef, flip } = camera

  return (
    <div className="flex flex-1 flex-col px-4 pt-3">
      {/* 章节提示条（弱化，不喧宾夺主） */}
      <div className="glass mx-auto mb-3 flex max-w-sm items-center gap-2 rounded-full px-4 py-2 text-coffee-600">
        <span className="text-[10px] tracking-[0.18em] text-coffee-400">{step.index}</span>
        <span className="text-[13px]">{step.title}</span>
        {isHero && (
          <span className="ml-1 rounded-full bg-sky-400/90 px-2 py-0.5 text-[10px] font-semibold text-beige-50">主角</span>
        )}
      </div>

      {/* 全屏取景框 */}
      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-[1.8rem] bg-beige-200 shadow-xl shadow-coffee-500/15 aspect-[3/4]">
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
          {enhancing ? '正在温柔修片…' : '正在收好这一刻…'}
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

// ---- 增强后确认视图（先肯定，再给一条可选建议） ----
function ReviewView({ analysis, enhancedSrc, theme, photoBg, onConfirm, onRetake, isLast, isHero }) {
  const css = theme
    ? {
        '--bg-glow': theme.glow,
        '--bg-accent': theme.accent,
        '--bg-mid': theme.mid,
        '--bg-deep': theme.deep,
      }
    : {}
  // 只取一条最温和的建议，避免"评分/评判"感
  const gentleTip = analysis?.suggestions?.[0]

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden px-5 pt-3 animate-fade-in">
      {/* 动态氛围背景 */}
      {photoBg && (
        <div className="memory-photo-bg" style={{ backgroundImage: `url(${photoBg})` }} />
      )}
      <div className="memory-bg absolute inset-0" style={css} />

      <div className="relative z-10 flex flex-1 flex-col">
        {/* 增强后照片（编辑式画框，照片是主角） */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="editorial-frame photo-vignette w-full aspect-[3/4]">
            <img src={enhancedSrc} alt="刚刚记录下的这一刻" className="photo-warm" />
            {/* 滤镜标签（弱化"AI 已优化"的评判感） */}
            <div className="glass-capsule absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5">
              <Icon name="sparkles" size={13} className="text-beige-50" />
              <span className="text-xs font-medium text-beige-50 photo-text-shadow">已为你轻轻收好</span>
            </div>
            {isHero && (
              <div className="glass-capsule-dark absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1">
                <Icon name="dish" size={12} className="text-beige-50" />
                <span className="text-[11px] font-semibold text-beige-50 photo-text-shadow">主角</span>
              </div>
            )}
          </div>
        </div>

        {/* 先肯定：这一刻已经留下了。 */}
        <div className="mx-auto mt-5 w-full max-w-sm text-center animate-pop">
          <h3 className="story-display text-xl text-coffee-600">这一刻已经留下了。</h3>
          {/* 可选的一条温和建议（不评分、不评判） */}
          {gentleTip && (
            <p className="mt-2 text-sm leading-relaxed text-coffee-500/90">
              如果愿意，{gentleTip}
            </p>
          )}
        </div>

        {/* 操作按钮：心理上同等正当 */}
        <div className="mx-auto mt-auto flex w-full max-w-sm gap-3 pb-6 pt-5">
          <GhostButton onClick={onRetake} icon="retake" className="flex-1">
            再拍一个角度
          </GhostButton>
          <PrimaryButton onClick={onConfirm} className="flex-1" icon="arrow">
            {isLast ? '就用这张，完成记录' : '就用这张'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
