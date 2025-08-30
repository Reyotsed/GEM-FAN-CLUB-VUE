# GEM Fan Club 前端项目 🎵

> 邓紫棋粉丝俱乐部的现代化前端应用，提供音乐、游戏、AI聊天等丰富的粉丝互动功能

## 🌟 项目简介

GEM Fan Club 是一个专为邓紫棋粉丝打造的综合性前端应用，集成了音乐播放、小游戏、AI虚拟聊天、图片分享、名言收藏等多种功能，为粉丝提供全方位的互动体验。

**官方网站**: [http://www.gemfanclub.com](http://www.gemfanclub.com)

## ✨ 主要功能

### 🎵 音乐相关
- **热门歌曲展示** - 展示邓紫棋的热门作品
- **冷门歌曲发现** - 推荐一些不太为人熟知的优质作品
- **歌词查看** - 完整的歌词显示功能
- **专辑封面展示** - 精美的专辑封面图片

### 🎮 互动游戏
- **猜歌游戏** - 听歌识曲，测试对邓紫棋歌曲的熟悉程度
- **歌词接龙** - 有趣的歌词接龙小游戏
- **抢票游戏** - 模拟演唱会抢票体验

### 🤖 AI虚拟聊天
- **智能对话** - 基于AI的邓紫棋虚拟聊天机器人
- **个性化回复** - 根据用户状态提供个性化回复
- **上下文管理** - 智能管理对话历史，保持对话连贯性

### 🖼️ 图片分享
- **精美图片展示** - 邓紫棋的各种精美照片
- **图片浏览** - 流畅的图片浏览体验

### 💬 名言收藏
- **经典语录** - 收集邓紫棋的经典名言
- **语录详情** - 详细的语录背景和解释

### 🛍️ 粉丝商店
- **周边商品** - 邓紫棋相关的周边商品展示
- **商品详情** - 详细的商品信息和图片

### 🗺️ 地理信息
- **中国地图** - 交互式中国地图展示
- **省份详情** - 各省份的详细信息

## 🛠️ 技术栈

- **前端框架**: Vue 3 + Composition API
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由管理**: Vue Router 4
- **样式处理**: CSS3 + 响应式设计
- **图标库**: Font Awesome
- **HTTP客户端**: Axios
- **开发语言**: JavaScript/ES6+

## 📦 安装和运行

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/Reyotsed/GEM-FAN-CLUB-VUE.git
cd GEM-FAN-CLUB-VUE
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
```

3. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
```

4. **构建生产版本**
```bash
npm run build
# 或
yarn build
```

5. **预览生产版本**
```bash
npm run preview
# 或
yarn preview
```

## 🚀 项目结构

```
src/
├── api/              # API接口配置
├── assets/           # 静态资源
├── components/       # 公共组件
│   ├── audio/       # 音频播放组件
│   ├── info/        # 信息展示组件
│   ├── Live2D/      # Live2D相关组件
│   ├── Login/       # 登录相关组件
│   ├── song/        # 歌曲相关组件
│   ├── upload/      # 上传相关组件
│   └── user/        # 用户相关组件
├── router/           # 路由配置
├── stores/           # 状态管理
├── utils/            # 工具函数
├── views/            # 页面组件
│   ├── AIPage/      # AI聊天页面
│   ├── GamesPage/   # 游戏页面
│   ├── HomePage/    # 首页
│   ├── InfoPage/    # 信息页面
│   ├── PicturePage/ # 图片页面
│   ├── QuotePage/   # 名言页面
│   ├── ShopPage/    # 商店页面
│   ├── SongPage/    # 歌曲页面
│   └── UserPage/    # 用户页面
├── App.vue          # 根组件
└── main.js          # 入口文件
```

## 🔧 配置说明

### 环境变量
项目使用 `.env` 文件管理环境变量，主要配置包括：
- API基础URL
- 应用配置
- 第三方服务配置

### API配置
- 后端API接口配置在 `src/utils/api.js` 中
- 支持请求拦截和响应拦截
- 统一的错误处理机制

## 🎯 开发指南

### 代码规范
- 使用ESLint进行代码检查
- 遵循Vue 3官方风格指南
- 组件命名采用PascalCase
- 文件命名采用kebab-case

### 组件开发
- 使用Composition API编写组件
- 组件功能单一，职责明确
- 合理使用props和emits
- 适当的组件抽象和复用

### 状态管理
- 使用Pinia进行状态管理
- 按功能模块划分store
- 合理使用computed和watch

## 📱 响应式设计

项目采用移动优先的响应式设计理念：
- 支持各种屏幕尺寸
- 移动端友好的交互设计
- 触摸手势支持
- 性能优化

## 🌐 浏览器支持

- Chrome >= 88
- Firefox >= 85
- Safari >= 14
- Edge >= 88

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🤝 贡献指南

欢迎提交Issue和Pull Request来帮助改进项目！

### 贡献步骤
1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📞 联系我们

- **项目维护者**: Reyotsed
- **项目地址**: [https://github.com/Reyotsed/GEM-FAN-CLUB-VUE](https://github.com/Reyotsed/GEM-FAN-CLUB-VUE)
- **官方网站**: [http://www.gemfanclub.com](http://www.gemfanclub.com)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和邓紫棋粉丝们！

---

⭐ 如果这个项目对你有帮助，请给我们一个Star！
