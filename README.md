# 🍽️ Dining Story · AI 餐饮记忆助手

一款 AI 驱动的餐饮记忆创作 Web 应用。它的目标**不是**强迫用户写评价，而是帮助顾客自然地捕捉并分享他们的用餐记忆。

> **核心概念：AI Dining Memory Assistant（AI 餐饮记忆助手）**
>
> 体验应像 **Apple Journal + Instagram Story + 手作餐厅品牌** 的结合，
> 让用户感觉「我珍藏了一个美好的夜晚」，而非「我完成了一项餐厅任务」。

## 🎨 品牌视觉（Sonho Kitchen）

温暖手作风格，**避免奢华酒店美学**：

- **Primary · Warm Beige** 暖米色 —— 页面底色与留白
- **Secondary · Coffee Brown** 咖啡棕 —— 标题、正文、主按钮
- **Accent · Soft Sky Blue** 柔和天蓝 —— 点缀、Hero 徽章、细线
- 避免纯黑背景，采用大量留白与编辑感排版

## ✨ 核心体验

用户从餐厅二维码进入，被邀请 **"收藏你的餐饮记忆"**（而非"写评价"），
通过 **1 张 Hero 主角照片 + 2 张 Memory Snapshots 支持照片** + AI 温柔整理，
生成一张可分享、可收藏的 Instagram Story 记忆卡。

## 🎬 用户流程

1. **QR 落地页** — 暖色手作邀请文案与食物 hero
2. **相机拍照** — Hero-first 构图引导（不鼓励等权）：
   - 📸 **氛围**（支持照片 · 环境 / 光）
   - 📸 **主角 · Hero**（招牌主菜，视觉强调，占主导）
   - 📸 **陪伴**（支持照片 · 相聚 / 举杯）
3. **AI 图像分析** — 每张照片后分析清晰度、亮度、构图、整洁度，**只给正向建议，绝不拒绝或负面评分**
4. **AI 照片增强** — 自动调光、锐化、套用餐厅风格滤镜
5. **AI 故事生成** — 基于识别菜品 + 用户选择，生成**独特标题**的可编辑记忆卡（收藏物件感）
6. **导出** — Hero-first 合成 9:16 Instagram Story 分享图（暖色手作）

## 🛠️ 技术栈

- **前端**：React 19 + Tailwind CSS 4
- **相机**：WebRTC API（`getUserMedia`）
- **AI 图像分析**：占位 API 架构（本地 Canvas 真实分析 + mock 响应）
- **图像处理**：Canvas API（亮度/对比度/饱和度/色温/锐化）
- **构建**：Vite 8

## 📁 项目结构

```
src/
├── App.jsx                 # 主状态机，路由各屏幕
├── index.css               # Tailwind + Sonho Kitchen 暖色主题变量
├── components/
│   ├── Icon.jsx            # 内联 SVG 图标
│   └── ui.jsx              # 通用 UI（按钮/进度/顶栏）
├── screens/
│   ├── LandingScreen.jsx   # QR 落地页
│   ├── CaptureScreen.jsx   # 相机拍照流程（Hero-first 引导）
│   ├── StoryScreen.jsx     # 故事生成与编辑（Hero-first 排版）
│   └── ExportScreen.jsx    # Instagram Story 导出
├── hooks/
│   └── useCamera.js        # WebRTC 相机 Hook
├── lib/
│   ├── aiAnalysis.js       # AI 图像分析（mock）
│   ├── imageEnhance.js     # Canvas 图像增强
│   ├── storyGenerator.js   # AI 故事生成（mock）
│   ├── visuals.js          # 动态色彩 / 模糊背景 / 主题提取
│   └── exportStory.js      # Instagram Story 合成（Hero-first）
└── data/
    └── photos.js           # 章节/选项/餐厅数据
```

## 🚀 运行

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 生产构建
npm run preview  # 预览构建产物
```

> **注意**：本项目使用 Vite 8，需要 Node.js `^20.19.0 || >=22.12.0`。若本机 Node 版本较低，构建时可能因缺少原生 binding 报错，可手动安装对应平台的 binding（如 `@rolldown/binding-darwin-arm64`）。

## 🚀 GitHub Pages 部署（自动）

本项目已配置 **GitHub Actions 自动部署** 到 GitHub Pages。仓库名为 `dining-story-app`，因此 `base` 已设为 `/dining-story-app/`。

### 首次部署步骤

1. **在 GitHub 新建仓库**，命名为 `dining-story-app`（Public 或 Private 均可，Public 免费）。
2. **推送代码**（用户名：`ZiyanTANG52638`）：
   ```bash
   git init
   git add .
   git commit -m "init: Sonho Kitchen dining memory"
   git branch -M main
   git remote add origin https://github.com/ZiyanTANG52638/dining-story-app.git
   git push -u origin main
   ```
3. **开启 GitHub Pages**：仓库 → `Settings` → `Pages` → `Build and deployment` → `Source` 选择 **GitHub Actions**。
4. 推送后 Actions 会自动构建并部署。完成后访问：
   ```
   https://ZiyanTANG52638.github.io/dining-story-app/
   ```

### 后续更新

每次 `git push` 到 `main` 分支，都会自动重新构建并部署，无需手动操作。

> **提示**：若你把仓库改成用户主页仓库（`<用户名>.github.io`），请把 [`vite.config.js`](vite.config.js) 中的 `base` 改回 `'/'`。

## 📱 演示模式

在无摄像头或未授权相机的环境中，拍照页提供 **"使用示例照片体验"** 按钮，可生成演示照片走完完整流程。

## 🔌 接入真实 AI

原型阶段使用 mock 响应。接入真实 AI 时，替换以下模块即可：

- [`src/lib/aiAnalysis.js`](src/lib/aiAnalysis.js) — 调用云端视觉 API（GPT-4V / Gemini）
- [`src/lib/storyGenerator.js`](src/lib/storyGenerator.js) — 调用 LLM 生成文案
- [`src/lib/imageEnhance.js`](src/lib/imageEnhance.js) — 可换用云端修图服务
