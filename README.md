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
- 避免粉 / 荧光黄 / 紫 / 亮绿（除非来自用户照片）

### 三层设计令牌（`src/lib/designTokens.js`）

| 层级 | 内容 | 说明 |
| --- | --- | --- |
| **Primitive** | `color` / `space` / `radius` / `font` | 原始值，唯一来源 |
| **Semantic** | `backgroundPrimary` / `surfacePaper` / `textPrimary` / `brandAccent` / `memoryAccent` / `decorativeLine` / `softShadow` | 语义化，供组件消费 |
| **Template** | `editorial.*` / `collage.*` / `classic.*` | 每套模板的视觉身份 |

## 🖼️ 产品主流程：Capture → Create Art Zine → Share

**用户不再选择版式。系统创造体验。**

```
Capture moments  →  Create Art Zine  →  Share memory
（拍三张照片）      （系统编排成一页）    （保存 / 分享）
```

Art Zine 艺术纸刊是**核心产品方向**。用户拍下三张照片后，系统用**用户自己的照片**
在本地 Canvas 真实渲染一张 `1080 × 1920` 的作品——不是把照片套进模板，
而是「今晚真的被重新做成了一张作品」。

### 真实照片管线（本阶段核心）

```
Camera / File input
  → Photo objects { id, url, type, timestamp }
  → ArtZineGenerator（generateArtZine）
  → 本地 Canvas 渲染 1080×1920
  → 成品图（dataURL）
```

- **统一照片对象结构**（`src/lib/photoStore.js`）：`{ id, url, type, timestamp, focalPoint }`
  - `type` 取值：`space`（空间氛围）/ `dish`（招牌主角）/ `memory`（记忆瞬间）
  - 渲染器只消费 `{ url, type, focalPoint }`，不关心来源（相机 / 文件 / demo）
- **会话级持久化**：`sessionStorage`（刷新不丢失，关闭标签页即清除；不写 localStorage）
- **不再使用静态 demo 图**：`ART_ZINE_DEMO_URL` 已移除，成品完全来自用户照片
- **纯本地**：照片不上传任何第三方

### 内容逻辑（三张照片承担不同角色，非等权矩形）

| 照片 | type | 角色 | 呈现方式 |
| --- | --- | --- | --- |
| 空间氛围 | `space` | spatial anchor（空间锚点） | 大留白中的一块真实摄影（矩形，无阴影） |
| 招牌主角 | `dish` | visual protagonist（视觉主角） | 有机遮罩裁切 + 柔和纸影，占据视觉主导 |
| 记忆瞬间 | `memory` | emotional fragment（情感碎片） | 小尺寸撕边碎片，微旋转斜置于留白 |

### 渲染器（`src/lib/artZineRender.js`）

`renderArtZine({ heroPhoto, supportPhoto1, supportPhoto2, memoryText, restaurantInfo, brandTokens })`

输出 `1080 × 1920` 的 dataURL（JPEG）。视觉语言（原创，非第三方模板）：

- 暖米色纸面 + 极淡纸纹 + 顶部受光渐层
- 超大中文主句（自动折行，每行 ≤ 6 字，最多 2 行）
- 极小英文元数据（`SONHO KITCHEN · 湖南 · 常德 · 2026.09.10`）
- 手绘蓝线（品牌签名，唯一装饰）
- 大留白 + 非对称构图
- 复用 `decor.js` 的 `ORGANIC_POINTS` 有机几何，与既有视觉语言一致

### 交互流程

1. 用户拍下三张照片（空间 / 主角 / 记忆）
2. 回答两个小问题（谁陪你 / 最难忘瞬间）
3. 进入**过渡屏**（`src/screens/ArtZineScreen.jsx`），三句文案依次浮现：
   - 「正在重新整理今晚的三个瞬间…」
   - 「寻找画面里的主角、光线与留白」
   - 「把它们装订成一页」
4. 平静的装订动画（三张纸片缓缓聚拢），**无技术感 spinner**
5. 进入**结果屏**（`src/components/ArtZineCanvas.jsx`）：标题「今晚，被装订成了一页」+ 成品图 + 主短句
6. 导出 / 分享（`ExportScreen` 直接使用成品图，不走 Canvas 模板）

### 未来服务端架构（已预留，前端不持有密钥）

```
Frontend
  → POST /api/generate-art-zine
  → serverless backend
  → visual generation service
  → 返回最终图片 URL
```

- 端点常量：`ART_ZINE_ENDPOINT = '/api/generate-art-zine'`
- 开关常量：`ART_ZINE_API_ENABLED`（当前 `false`）
- **绝不在前端代码中放置 API Key**，**绝不在浏览器内直接运行 agent skills**
- 未来只需把 `ART_ZINE_API_ENABLED` 置为 `true`，调用方无需改动
- 服务端不可用时，自动回退到本地渲染器（`renderArtZine`），**绝不留下空白**

### 兜底：01–03 确定性模板

01–03（Editorial / Memory Collage / Classic）**保留为兜底与「换一种收藏方式」**，
但不再是主选择入口：

| # | 模式 | 中文名 | 类型 |
| --- | --- | --- | --- |
| 01 | **Editorial** | 编辑手记 | 确定性模板 · 即时 |
| 02 | **Memory Collage** | 晚餐手帖 | 确定性模板 · 即时 |
| 03 | **Classic** | 经典收藏 | 确定性模板 · 即时 · 兜底 |

- 生成失败 → 「先保存为经典收藏」→ 回退 Classic
- 结果屏「换一种收藏方式」→ 进入确定性模板选择
- 确定性排版引擎（`templates.js` + `layoutEngine.js`）保持不变：固定 slots、预览 = 导出、矢量装饰

**文案约束**（`src/lib/artZineCopy.js`）：主短句 ≤ 12 个中文字符；全程无 AI / model / processing / API 等技术术语。

## ✨ 核心体验

用户从餐厅二维码进入，被邀请 **"收藏你的餐饮记忆"**（而非"写评价"），
通过 **1 张 Hero 主角照片 + 2 张 Memory Snapshots 支持照片** + AI 温柔整理，
生成一张可分享、可收藏的 Instagram Story 记忆卡。

## 🎬 用户流程

1. **QR 落地页** — 暖色手作邀请文案与食物 hero
2. **相机拍照** — 三张照片，各有角色（不鼓励等权）：
   - 📸 **空间**（`type: space` · 环境 / 光）→ 空间锚点
   - 📸 **主角**（`type: dish` · 招牌主菜，视觉强调）→ 视觉主角
   - 📸 **记忆**（`type: memory` · 相聚 / 举杯）→ 情感碎片
3. **AI 图像分析** — 每张照片后分析清晰度、亮度、构图、整洁度，**只给正向建议，绝不拒绝或负面评分**
4. **AI 照片增强** — 自动调光、锐化、套用餐厅风格滤镜
5. **回答两个小问题** — 谁陪你 / 最难忘瞬间（不选择版式）
6. **Create Art Zine** — 过渡屏（三句文案）→ 本地 Canvas 用**用户自己的三张照片**渲染 `1080 × 1920` 成品
7. **Share memory** — 保存 / 分享到 Instagram（成品图直接导出，不走模板）

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
│   ├── ui.jsx              # 通用 UI（按钮/进度/顶栏）
│   ├── StoryCanvas.jsx     # 固定 1080×1920 预览渲染器（与导出一致）
│   ├── StoryPreview.jsx    # 9:16 预览容器
│   ├── StoryDecor.jsx      # 预览端 SVG/CSS 装饰组件
│   └── ArtZineCanvas.jsx   # Art Zine 成品图展示（含兜底）
├── screens/
│   ├── LandingScreen.jsx   # QR 落地页
│   ├── CaptureScreen.jsx   # 相机拍照流程（产出统一 photo 对象）
│   ├── StoryScreen.jsx     # 主流程：两个小问题 → Create Art Zine（01–03 为兜底）
│   ├── ArtZineScreen.jsx   # Art Zine 过渡屏（三句文案 + 装订动画）
│   └── ExportScreen.jsx    # Instagram Story 导出（成品图直接导出）
├── hooks/
│   └── useCamera.js        # WebRTC 相机 Hook
├── lib/
│   ├── designTokens.js     # 三层设计令牌（primitive / semantic / template）
│   ├── photoStore.js       # 统一照片对象 { id, url, type, timestamp } + 会话存储
│   ├── artZineRender.js    # ★ Art Zine 真实渲染器（用户照片 → 1080×1920 dataURL）
│   ├── artZine.js          # Art Zine 生成接口（本地渲染 + 未来后端预留）
│   ├── artZineCopy.js      # Art Zine 文案库（过渡三句 / 短句 ≤12 字）
│   ├── templates.js        # 01–03 确定性模板定义（兜底）
│   ├── layoutEngine.js     # 确定性排版引擎（cover 裁切 / 焦点 / 分配）
│   ├── photoNormalize.js   # 照片归一化（比例 / 方向 / 焦点 / 主色）
│   ├── photoAnalysis.js    # 照片像素分析（mock AI）
│   ├── decor.js            # Canvas 装饰绘制库（胶带 / 纸层 / 遮罩…）
│   ├── renderTemplate.js   # Canvas 导出渲染器（与预览同源，仅 01–03）
│   ├── aiModules.js        # AI 能力接口骨架（推荐模板 / 短文案）
│   ├── aiAnalysis.js       # AI 图像分析（mock）
│   ├── imageEnhance.js     # Canvas 图像增强
│   ├── storyGenerator.js   # AI 故事生成（mock）
│   ├── visuals.js          # 动态色彩 / 模糊背景 / 主题提取
│   └── exportStory.js      # Instagram Story 导出入口
└── data/
    └── photos.js           # 章节/选项/餐厅数据
```

> `public/images/art-zine-demo.png` 为早期原型阶段的预置成品图，**当前主流程已不再使用**
> （成品完全由用户照片在本地渲染）。保留该文件仅作历史参考。

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
