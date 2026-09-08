// 主应用 —— 状态机路由各屏幕
import { useState } from 'react'
import LandingScreen from './screens/LandingScreen'
import CaptureScreen from './screens/CaptureScreen'
import StoryScreen from './screens/StoryScreen'
import ExportScreen from './screens/ExportScreen'

const SCREEN = {
  LANDING: 'landing',
  CAPTURE: 'capture',
  STORY: 'story',
  EXPORT: 'export',
}

export default function App() {
  const [screen, setScreen] = useState(SCREEN.LANDING)
  const [photos, setPhotos] = useState([])
  const [storyData, setStoryData] = useState(null)

  // 完成三张照片拍摄
  const handleCaptureComplete = (capturedPhotos) => {
    setPhotos(capturedPhotos)
    setScreen(SCREEN.STORY)
  }

  // 完成故事生成与编辑
  const handleStoryComplete = (story, companionObj, momentObj) => {
    setStoryData({ story, companionObj, momentObj })
    setScreen(SCREEN.EXPORT)
  }

  // 重新开始
  const handleRestart = () => {
    setPhotos([])
    setStoryData(null)
    setScreen(SCREEN.LANDING)
  }

  return (
    <div className="mx-auto min-h-svh w-full max-w-md bg-beige-100">
      {screen === SCREEN.LANDING && (
        <LandingScreen onStart={() => setScreen(SCREEN.CAPTURE)} />
      )}

      {screen === SCREEN.CAPTURE && (
        <CaptureScreen
          initialPhotos={photos}
          onComplete={handleCaptureComplete}
          onExit={() => setScreen(SCREEN.LANDING)}
        />
      )}

      {screen === SCREEN.STORY && (
        <StoryScreen
          photos={photos}
          onBack={() => setScreen(SCREEN.CAPTURE)}
          onComplete={handleStoryComplete}
        />
      )}

      {screen === SCREEN.EXPORT && storyData && (
        <ExportScreen
          photos={photos}
          story={storyData.story}
          companionObj={storyData.companionObj}
          momentObj={storyData.momentObj}
          onRestart={handleRestart}
        />
      )}
    </div>
  )
}
