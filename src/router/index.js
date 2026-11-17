import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { trackPageView, trackNavigation } from '@/utils/stats'
const Index = () => import('@/views/Index.vue')
const AIPage = () => import('@/views/AIPage/AIPage.vue')
const InfoPage = () => import('@/views/InfoPage/InfoPage.vue')
const QuotePage = () => import('@/views/QuotePage/QuotePage.vue')
const ShopPage = () => import('@/views/ShopPage/ShopPage.vue')
const SongPage = () => import('@/views/SongPage/SongPage.vue')
const HomePage = () => import('@/views/HomePage/HomePage.vue')
const UserPage = () => import('@/views/UserPage/UserPage.vue')
const UploadModal = () => import('@/components/upload/UploadModal.vue')
const QuoteInfoPage = () => import('@/views/QuotePage/QuoteInfoPage.vue')
const GamesPage = () => import('@/views/GamesPage/GamesPage.vue')
const GuessSongGame = () => import('@/views/GamesPage/GuessSongGame.vue')
const LyricsChainGame = () => import('@/views/GamesPage/LyricsChainGame.vue')
const QuizGame = () => import('@/views/GamesPage/QuizGame.vue')
const TicketRushGame = () => import('@/views/GamesPage/TicketRushGame.vue')
const HummingbirdStrikeGame = () => import('@/views/GamesPage/HummingbirdStrikeGame.vue')
const DailyGuessGame = () => import('@/views/GamesPage/DailyGuessGame.vue')
const StoryPage = () => import('@/views/StoryPage/StoryPage.vue')
const FanMapPage = () => import('@/views/FanMapPage/FanMapPage.vue')
const DashboardPage = () => import('@/views/DashboardPage/DashboardPage.vue')

const routes = [
    { path: '/', redirect: '' },
    {
        path: '',
        name: "index",
        component: Index,
        meta: { requestAuth: false },
        children: [
            { path: '', name: "home", component: HomePage, meta: { title: 'GEM Fan Club - 首页' } },
            { path: 'song', name: "song", component: SongPage, meta: { title: 'GEM Fan Club - 音乐' } },
{ path: 'quote', name: "quote", component: QuotePage, meta: { title: 'GEM Fan Club - 广场' } },
    { path: 'quote/:id', name: "quoteInfo", component: QuoteInfoPage, meta: { title: 'GEM Fan Club - 帖子详情' } },
            { path: 'shop', name: "shop", component: ShopPage, meta: { title: 'GEM Fan Club - 商店' } },
            { path: 'ai', name: "AI", component: AIPage, meta: { title: 'GEM Fan Club - AI 对话' } },
            { path: 'info', name: "info", component: InfoPage, meta: { title: 'GEM Fan Club - 信息' } },
            { path: 'user', name: "user", component: UserPage, meta: { requestAuth: true, title: 'GEM Fan Club - 个人中心' } },
            { path: 'upload', name: "upload", component: UploadModal, meta: { requestAuth: true, title: 'GEM Fan Club - 上传' } },
            { path: 'games', name: "games", component: GamesPage, meta: { title: 'GEM Fan Club - 游戏' } },
            { path: 'games/guess-song', name: "guess-song", component: GuessSongGame, meta: { title: 'GEM Fan Club - 猜歌游戏' } },
            { path: 'games/lyrics-chain', name: "lyrics-chain", component: LyricsChainGame, meta: { title: 'GEM Fan Club - 歌词接龙' } },
            { path: 'games/quiz', name: "quiz", component: QuizGame, meta: { title: 'GEM Fan Club - 知识问答' } },
            { path: 'games/ticket-rush', name: "ticket-rush", component: TicketRushGame, meta: { title: 'GEM Fan Club - 抢票模拟' } },
            { path: 'games/hummingbird-strike', name: "hummingbird-strike", component: HummingbirdStrikeGame, meta: { title: 'GEM Fan Club - 痛击蜂鸟' } },
            { path: 'games/daily', name: "daily-guess", component: DailyGuessGame, meta: { title: 'GEM Fan Club - 每日猜歌' } },
            { path: 'story', name: "story", component: StoryPage, meta: { title: 'GEM Fan Club - 快拍' } },
            { path: 'fan-map', name: "fan-map", component: FanMapPage, meta: { title: 'GEM Fan Club - 全球粉丝地图' } }
        ]
    },
    // 隐藏的运营看板路由（不在 PAGE_KEY_MAP 中，不会上报 PV，需账号密码登录）
    { path: '/__ops__/dashboard', name: 'dashboard', component: DashboardPage, meta: { title: 'GEM 运营看板' } }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0 }
        }
    }
});

export default router;

// Route guard: protect pages that require authentication & set page title
router.beforeEach((to, from, next) => {
    // Set document title from route meta
    if (to.meta.title) {
        document.title = to.meta.title;
    } else {
        document.title = 'GEM Fan Club';
    }

    if (to.meta.requestAuth) {
        const userStore = useUserStore();
        if (!userStore.isLoggedIn) {
            // Redirect to home page if not logged in
            next({ name: 'home' });
            return;
        }
    }
    next();
});

// 页面访问统计：路由切换后自动上报 PV + 会话/落地页/首页去向/分享回流
router.afterEach((to, from) => {
    if (to.name) {
        trackPageView(to.name);
        trackNavigation(to, from);
    }
});