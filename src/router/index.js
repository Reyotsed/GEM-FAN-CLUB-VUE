import { createRouter, createWebHistory } from 'vue-router'
const Index = () => import('../views/Index.vue')
const AIPage = () => import('@/views/AIPage/AIPage.vue')
const InfoPage = () => import('@/views/InfoPage/InfoPage.vue')
const PicturePage = () => import('@/views/PicturePage/PicturePage.vue')
const QuotePage = () => import('@/views/QuotePage/QuotePage.vue')
const ShopPage = () => import('@/views/ShopPage/ShopPage.vue')
const SongPage = () => import('@/views/SongPage/SongPage.vue')
const VideoPage = () => import('@/views/VideoPage/VideoPage.vue')
const HomePage = () => import('@/views/HomePage/HomePage.vue')
const UserPage = () => import('@/views/UserPage/UserPage.vue')
const UploadModal = () => import('@/components/upload/UploadModal.vue')
const QuoteInfoPage = () => import('@/views/QuotePage/QuoteInfoPage.vue')

const routes = [
    { path: '/', redirect: '' },
    {
        path: '',
        name: "index",
        component: Index, // 使用布局组件作为父组件
        meta: { requestAuth: false },
        children: [
          { path: '', name: "home", component: HomePage }, // 默认展示首页
          { path: 'video', name: "video", component: VideoPage },
          { path: 'song', name: "song", component: SongPage },
          { path: 'quote', name: "quote", component: QuotePage},
          { path: 'quote/:id', name: "quoteInfo", component: QuoteInfoPage},
          { path: 'picture', name: "picture", component: PicturePage},
          { path: 'shop', name: "shop", component: ShopPage},
          { path: 'AI', name: "AI", component: AIPage},
          { path: 'info', name: "info", component: InfoPage},
          { path: 'user', name: "user", component: UserPage},
          { path: 'upload', name: "upload", component: UploadModal},
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;