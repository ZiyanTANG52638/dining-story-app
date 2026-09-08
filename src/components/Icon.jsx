// 轻量图标组件 —— 使用内联 SVG，避免额外依赖
const PATHS = {
  sparkle: (
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
  ),
  dish: (
    <path d="M12 3a9 9 0 0 0-9 9h18a9 9 0 0 0-9-9zM5 15h14a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2z" />
  ),
  heart: (
    <path d="M12 21s-7.5-4.7-9.7-9.2C.8 8.6 2.6 5 6 5c2 0 3.3 1 4 2.3C10.7 6 12 5 14 5c3.4 0 5.2 3.6 3.7 6.8C19.5 16.3 12 21 12 21z" />
  ),
  camera: (
    <path d="M4 7h2.5l1.5-2h8l1.5 2H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm8 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-2a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
  ),
  flip: (
    <path d="M12 5V1L7 6l5 5V7a6 6 0 0 1 6 6 6 6 0 0 1-1.2 3.6l1.4 1.4A8 8 0 0 0 12 5zM12 17a6 6 0 0 1-6-6 6 6 0 0 1 1.2-3.6L5.8 6A8 8 0 0 0 12 19v4l5-5-5-5v4z" />
  ),
  check: <path d="M9 16.2l-3.5-3.5L4 14.2 9 19l11-11-1.5-1.5L9 16.2z" />,
  arrow: <path d="M12 4l-1.4 1.4L16.2 11H4v2h12.2l-5.6 5.6L12 20l8-8-8-8z" />,
  back: <path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z" />,
  download: (
    <path d="M12 3v10.2l-3.6-3.6L7 11l5 5 5-5-1.4-1.4L12 13.2V3zM5 19h14v2H5v-2z" />
  ),
  edit: (
    <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  ),
  sparkles: (
    <path d="M12 2l1.6 4.4L18 8l-4.4 1.6L12 14l-1.6-4.4L6 8l4.4-1.6L12 2zM19 13l.9 2.1L22 16l-2.1.9L19 19l-.9-2.1L16 16l2.1-.9L19 13zM5 13l.9 2.1L8 16l-2.1.9L5 19l-.9-2.1L2 16l2.1-.9L5 13z" />
  ),
  retake: (
    <path d="M12 5V1L7 6l5 5V7a6 6 0 0 1 6 6 6 6 0 0 1-1.2 3.6l1.4 1.4A8 8 0 0 0 12 5zM12 17a6 6 0 0 1-6-6 6 6 0 0 1 1.2-3.6L5.8 6A8 8 0 0 0 12 19v4l5-5-5-5v4z" />
  ),
}

export default function Icon({ name, size = 24, className = '', fill = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      className={className}
      aria-hidden="true"
    >
      {PATHS[name] || null}
    </svg>
  )
}
