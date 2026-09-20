// 记忆卡预览 —— 使用 StoryCanvas 的固定画布预览
//
// 设计原则：
//   - 预览 = 整块 1080 × 1920 画布等比缩放（非响应式重排）
//   - 与 Canvas 导出共用同一份 templates.js slots 配置
//   - 容器保持精确 9:16
import StoryCanvas from './StoryCanvas'

export default function StoryPreview({
  photos,
  story,
  templateId,
  caption,
  heroCutout = null,
  className = '',
}) {
  return (
    <div className={`relative mx-auto w-full max-w-[19rem] ${className}`}>
      <div className="editorial-frame relative w-full overflow-hidden bg-beige-200">
        <StoryCanvas
          templateId={templateId}
          photos={photos}
          story={story}
          caption={caption}
          heroCutout={heroCutout}
        />
      </div>
    </div>
  )
}
