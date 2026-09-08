// WebRTC 相机 Hook —— 管理摄像头生命周期与拍照
import { useCallback, useEffect, useRef, useState } from 'react'

export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)
  const [facingMode, setFacingMode] = useState('environment')

  // 启动摄像头
  const start = useCallback(async (mode = 'environment') => {
    setError(null)
    setReady(false)
    try {
      // 先停掉旧流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      streamRef.current = stream
      setFacingMode(mode)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setReady(true)
    } catch (e) {
      setError(e)
      setReady(false)
    }
  }, [])

  // 切换前后摄像头
  const flip = useCallback(() => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    return start(next)
  }, [facingMode, start])

  // 拍照：把当前视频帧绘制到 canvas 并返回 dataURL
  const capture = useCallback(() => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return null
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    // 前置摄像头需要镜像，后置不需要
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.92)
  }, [facingMode])

  // 停止摄像头
  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setReady(false)
  }, [])

  // 组件卸载时自动释放
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  return { videoRef, start, stop, flip, capture, ready, error, facingMode }
}
