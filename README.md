<div align="center">

# 🎵 GEM Fan Club · Web

**邓紫棋粉丝俱乐部 — Vue 3 前端**

[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D.svg?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Pinia](https://img.shields.io/badge/Pinia-3.0-yellow.svg)](https://pinia.vuejs.org/)
[![ECharts](https://img.shields.io/badge/ECharts-5.6-AA344D.svg)](https://echarts.apache.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#-许可证)

集音乐播放、AI 对话、互动游戏、图片瀑布流、Instagram 快拍、演唱会地图于一体的粉丝向 Web 应用。

🌐 **线上地址** · [www.gemfanclub.com](http://www.gemfanclub.com)

</div>

---

## 🧭 项目矩阵

`GEM Fan Club` 是一个由四个独立仓库构成的全栈项目，本仓库为**前端展现层**：

```
┌─────────────────────────┐  HTTP/SSE  ┌─────────────────────────┐
│  GEM-FAN-CLUB-VUE  🎨   │ ─────────► │  GEM-FAN-CLUB-WEB  ⚙️   │
│  Vue 3 · Vite · Pinia   │            │  Spring Boot · MySQL    │
│  （本仓库）              │ ◄───────── │  Redis · WebFlux        │
└─────────────────────────┘            └────────────┬────────────┘
                                                    │ HTTP/SSE
                                                    ▼
┌─────────────────────────┐    sync    ┌─────────────────────────┐
│  GEM_FAN_CLUB_DATA_PY 📷│ ─────────► │  GEM_FAN_CLUB_RAG  🤖   │
│  Weibo + VLM 图片流水线 │            │  RAG · Agent · GLM-4.7  │
└─────────────────────────┘            └─────────────────────────┘
```

---

## ✨ 功能模块

| 模块              | 功能                                  | 关键实现                                |
| ----------------- | ------------------------------------- | --------------------------------------- |
| 🏠 **首页**        | Hero Banner + 自动轮播                | WebP 自适应 + JPEG 降级，首图 Preload   |
| 🎵 **音乐**        | 热门 / 冷门歌曲 + 同步歌词            | 网易云 API 定时抓取，自定义播放器       |
| 🤖 **AI 对话**     | 邓紫棋人设 AI 助手                    | SSE 流式输出，对接后端 RAG Agent        |
| 🎮 **游戏中心**    | 猜歌 / 歌词接龙 / 知识问答 / 抢票模拟 | 排行榜 + Redis 秒杀                     |
| 🖼️ **图片墙**      | 瀑布流图集                            | `vue-masonry-wall` + LRU 缓存           |
| 💬 **语录**        | 经典语录 + 评论 + 点赞                | 富文本卡片，详情页路由                  |
| 🛍️ **商店**        | 周边商品展示                          | 商品详情 + 图片预览                     |
| 📸 **快拍**        | Instagram Stories 同步                | 视频/图片轮播，定时抓取                 |
| 🗺️ **演唱会地图**  | 交互式中国地图                        | ECharts 省份下钻，历年巡演可视化        |
| 👤 **个人中心**    | 登录注册 / 资料 / 头像                | Token 自动登录，前端图片压缩            |
| 📊 **行为埋点**    | PV + 自定义事件                       | 路由钩子自动 PV，关键交互手动事件       |
| 🎭 **Live2D**      | 看板娘 + 歌词气泡                     | 随机邓紫棋歌词飘字                      |

---

## 🛠️ 技术栈

| 类别        | 技术                                                  |
| ----------- | ----------------------------------------------------- |
| 框架        | Vue 3.5 (Composition API)                             |
| 构建        | Vite 6.2 + Rollup `manualChunks` 代码分割             |
| 状态管理    | Pinia 3.0（user / song / page）                       |
| 路由        | Vue Router 4.5（懒加载）                              |
| 可视化      | ECharts 5.6（地图、统计）                             |
| 瀑布流      | `@yeger/vue-masonry-wall` 5.0                         |
| HTTP        | Axios 1.8（统一拦截 + 图片代理）                      |
| 音频        | `vue3-audio-player` 1.0                               |
| 图片优化    | Sharp + `vite-plugin-image-optimizer`（WebP/JPEG）    |
| 客户端压缩  | `browser-image-compression` 2.0                       |
| 字体 / 图标 | Google Fonts + Font Awesome（异步非阻塞）             |

### 构建优化要点

- **图片**：构建期 Sharp 压缩 → 同名 `.webp` + `.jpg` 双格式，HTML 通过 `<picture>` 自适应。
- **代码分割**：`vue-vendor` / `echarts-vendor` / `axios-vendor` / `layout-vendor` 四个 chunk 隔离。
- **CSS**：`cssCodeSplit: true`，按路由切片。
- **预加载**：DNS prefetch + preconnect + 首屏 Banner `preload`。
- **Tree Shaking**：Terser 压缩，生产环境剥离 `console` / `debugger`。

---

## 🚀 快速开始

```bash
# 1. 克隆 & 安装
git clone https://github.com/Reyotsed/GEM-FAN-CLUB-VUE.git
cd GEM-FAN-CLUB-VUE
npm install

# 2. 开发
npm run dev              # 启动 Vite Dev Server

# 3. 构建
npm run build            # Web 生产构建
npm run build:app        # APP 模式构建（不同环境变量）
npm run preview          # 本地预览构建产物

# 4. （可选）压缩 public/img/homepage 下的原图
npm run compress-images
```

> **环境要求**：Node.js ≥ 16，npm ≥ 8。

### 环境变量

| 文件               | 用途                                          |
| ------------------ | --------------------------------------------- |
| `.env`             | 通用变量（DeepSeek API Key 等，已 gitignore） |
| `.env.development` | 开发：本地后端 API 地址                       |
| `.env.production`  | 生产：通过 Nginx 反向代理                     |
| `.env.app`         | APP 打包专用                                  |

---

## 📁 项目结构

```text
GEM-FAN-CLUB-VUE/
├── index.html                  # 入口（含 preconnect / preload）
├── vite.config.js              # 构建配置（chunk 分割、图片优化）
├── public/
│   ├── data/                   # 静态数据（地图 GeoJSON / 歌曲）
│   └── img/                    # 图片资源（homepage / albumCover / icon）
├── scripts/
│   ├── compress_images.js      # Sharp 批量压缩
│   ├── fetch_gem_songs.py      # 网易云热歌定时抓取
│   └── ig_story_scraper.py     # Instagram 快拍定时抓取
└── src/
    ├── main.js / App.vue / style.css
    ├── router/                 # 懒加载路由
    ├── stores/                 # Pinia (user / song / page)
    ├── utils/                  # api / imageCache(LRU) / stats / toast
    ├── components/
    │   ├── Live2D.vue          # 看板娘
    │   ├── audio/              # 自定义音频播放器
    │   ├── song/               # 歌曲列表 + 专辑
    │   ├── info/               # 中国地图（省份下钻）
    │   └── story/ Login/ upload/ user/
    └── views/
        ├── TopNav.vue · Index.vue
        ├── HomePage / SongPage / AIPage
        ├── GamesPage/   # GuessSong / LyricsChain / Quiz / TicketRush
        ├── PicturePage / QuotePage / StoryPage / ShopPage
        └── InfoPage（ECharts 地图） · UserPage（个人中心）
```

---

## 🔗 关联仓库

| 仓库                     | 角色                       | 链接                                                       |
| ------------------------ | -------------------------- | ---------------------------------------------------------- |
| **GEM-FAN-CLUB-WEB**     | Spring Boot 后端 API       | [GitHub](https://github.com/Reyotsed/GEM-FAN-CLUB-WEB)     |
| **GEM_FAN_CLUB_RAG**     | RAG / Agent AI 服务        | [GitHub](https://github.com/Reyotsed/GEM_FAN_CLUB_RAG)     |
| **GEM_FAN_CLUB_DATA_PY** | 微博图片 + VLM 打分流水线  | 同 monorepo 下 `GEM_FAN_CLUB_DATA_PY/`                     |

---

## 📄 许可证

[MIT License](LICENSE)

---

<div align="center">

⭐ 如果这个项目对你有帮助，欢迎 Star ｜ Made with ❤️ for **G.E.M.** fans

</div>
