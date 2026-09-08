import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 项目站点部署路径：<用户名>.github.io/dining-story-app/
  // 若改为用户主页仓库（<用户名>.github.io），请把 base 改回 '/'
  base: '/dining-story-app/',
  plugins: [react(), tailwindcss()],
  server: {
    // 允许通过 HTTPS 隧道（如 localhost.run / cloudflared）访问开发服务器，
    // 以便在手机上通过安全上下文调用相机（getUserMedia 需要 HTTPS）。
    host: true,
    allowedHosts: true,
  },
})
