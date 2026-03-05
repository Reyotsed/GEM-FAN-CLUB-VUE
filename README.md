# 🎵 GEM Fan Club - 前端应用

<div align="center">

![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D.svg?logo=vue.js)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF.svg?logo=vite)
![Pinia](https://img.shields.io/badge/Pinia-3.0-yellow.svg)
![ECharts](https://img.shields.io/badge/ECharts-5.6-AA344D.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

邓紫棋 (G.E.M.) 粉丝俱乐部的现代化前端应用，集音乐、游戏、AI聊天、图片、语录等多功能于一体。

🌐 **官网**: [www.gemfanclub.com](http://www.gemfanclub.com)

</div>

---

## ✨ 功能一览

| 模块           | 功能                                  | 说明                                        |
| -------------- | ------------------------------------- | ------------------------------------------- |
| 🏠 **首页**     | Hero Banner + 轮播                    | WebP 自适应 + JPEG 降级，图片已优化至 745KB |
| 🎵 **音乐**     | 热门/冷门歌曲 + 歌词                  | 网易云 API 定时抓取，专辑封面展示           |
| 🤖 **AI 对话**  | 智能聊天机器人                        | 对接后端 RAG Agent，模拟邓紫棋语气          |
| 🎮 **游戏中心** | 猜歌 / 歌词接龙 / 知识问答 / 抢票模拟 | 多种互动小游戏                              |
| 🖼️ **图片**     | 瀑布流图片墙                          | Masonry 布局，流畅浏览                      |
| 💬 **语录**     | 经典语录收藏                          | 点赞、评论、详情页                          |
| 🛍️ **商店**     | 周边商品展示                          | 商品详情 + 图片                             |
| 🗺️ **地图**     | 交互式中国地图                        | ECharts 省份下钻                            |
| 👤 **个人中心** | 用户管理                              | 登录/注册，个人信息                         |
| 🎭 **Live2D**   | 虚拟形象                              | 页面角落 Live2D 看板娘                      |

## 🛠️ 技术栈

| 类别        | 技术                    | 版本 |
| ----------- | ----------------------- | ---- |
| 前端框架    | Vue 3 + Composition API | 3.5  |
| 构建工具    | Vite                    | 6.2  |
| 状态管理    | Pinia                   | 3.0  |
| 路由        | Vue Router              | 4.5  |
| 图表可视化  | ECharts                 | 5.6  |
| 瀑布流布局  | vue-masonry-wall        | 5.0  |
| HTTP 客户端 | Axios                   | 1.8  |
| 音频播放器  | vue3-audio-player       | 1.0  |
| 图标        | Font Awesome (CDN)      | —    |
| 字体        | Google Fonts (异步加载) | —    |

### 构建优化

- **图片压缩**: Sharp + vite-plugin-image-optimizer，自动生成 WebP + JPEG 降级
- **代码分割**: Rollup manualChunks（vue-vendor / echarts-vendor / axios-vendor / layout-vendor）
- **CSS 分割**: `cssCodeSplit: true`
- **Tree Shaking**: Terser 压缩，生产环境自动移除 console/debugger
- **资源预加载**: DNS prefetch + preconnect + 首图 preload
- **字体异步**: Google Fonts & Font Awesome 非阻塞加载

## 🚀 快速开始

### 环境要求

- Node.js ≥ 16
- npm ≥ 8

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/Reyotsed/GEM-FAN-CLUB-VUE.git
cd GEM-FAN-CLUB-VUE

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 图片压缩（可选）

```bash
# 压缩 public/img/homepage 下的图片，生成 WebP + 压缩 JPEG
npm run compress-images
```

### 环境变量

| 文件               | 说明                     |
| ------------------ | ------------------------ |
| `.env`             | 通用配置（DeepSeek API） |
| `.env.development` | 开发环境 API 地址        |
| `.env.production`  | 生产环境 API 地址        |

## 📁 项目结构

```
GEM-FAN-CLUB-VUE/
├── index.html                  # 入口 HTML（含资源预加载优化）
├── vite.config.js              # Vite 构建配置
├── package.json
├── public/
│   ├── data/                   # 静态数据 (地图 JSON, 歌曲数据)
│   └── img/                    # 图片资源 (homepage, albumCover, icon...)
├── scripts/
│   ├── compress_images.js      # 图片压缩脚本 (Sharp)
│   ├── fetch_gem_songs.py      # 网易云热歌定时抓取
│   └── ig_story_scraper.py     # Instagram 快拍定时抓取
└── src/
    ├── main.js                 # 应用入口
    ├── App.vue                 # 根组件
    ├── style.css               # 全局样式
    ├── router/index.js         # 路由配置（懒加载）
    ├── stores/                 # Pinia 状态管理
    │   ├── user.js             # 用户状态
    │   ├── song.js             # 歌曲状态
    │   └── page.js             # 页面状态
    ├── utils/
    │   ├── api.js              # Axios 请求封装
    │   ├── imageCache.js       # 图片缓存工具
    │   └── toast.js            # Toast 通知工具
    ├── components/
    │   ├── Live2D.vue          # Live2D 看板娘
    │   ├── audio/              # 音频播放组件
    │   ├── song/               # 歌曲相关组件
    │   ├── info/               # 信息展示组件
    │   ├── Login/              # 登录组件
    │   ├── upload/             # 上传组件
    │   └── user/               # 用户组件
    └── views/
        ├── TopNav.vue          # 顶部导航栏
        ├── HomePage/           # 首页（WebP Banner）
        ├── SongPage/           # 音乐页
        ├── AIPage/             # AI 聊天页
        ├── GamesPage/          # 游戏中心
        │   ├── GuessSongGame   # 猜歌游戏
        │   ├── LyricsChainGame # 歌词接龙
        │   ├── QuizGame        # 知识问答
        │   └── TicketRushGame  # 抢票模拟
        ├── PicturePage/        # 图片墙
        ├── QuotePage/          # 语录页
        ├── ShopPage/           # 商店页
        ├── InfoPage/           # 信息页（ECharts 地图）
        └── UserPage/           # 个人中心
```

## 🔗 关联项目

| 项目                 | 说明                 | 仓库                                                   |
| -------------------- | -------------------- | ------------------------------------------------------ |
| **GEM-FAN-CLUB-WEB** | Spring Boot 后端 API | [GitHub](https://github.com/Reyotsed/GEM-FAN-CLUB-WEB) |
| **GEM_FAN_CLUB_RAG** | RAG AI 聊天服务      | [GitHub](https://github.com/Reyotsed/GEM_FAN_CLUB_RAG) |

## 📄 许可证

MIT License

---

<div align="center">

⭐ **如果这个项目对你有帮助，请给一个 Star！**

Made with ❤️ for G.E.M. fans

</div>
