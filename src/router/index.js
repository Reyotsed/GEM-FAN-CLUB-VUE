import { createRouter, createWebHistory } from 'vue-router'
const Index = () => import('../views/Index.vue')
const AIPage = () => import('@/views/AIPage/AIPage.vue')
const InfoPage = () => import('@/views/InfoPage/InfoPage.vue')
const PicturePage = () => import('@/views/PicturePage/PicturePage.vue')
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

const routes = [
    { path: '/', redirect: '' },
    {
        path: '',
        name: "index",
        component: Index,
        meta: { requestAuth: false },
        children: [
          { path: '', name: "home", component: HomePage },
          { path: 'song', name: "song", component: SongPage },
          { path: 'quote', name: "quote", component: QuotePage},
          { path: 'quote/:id', name: "quoteInfo", component: QuoteInfoPage},
          { path: 'picture', name: "picture", component: PicturePage},
          { path: 'shop', name: "shop", component: ShopPage},
          { path: 'AI', name: "AI", component: AIPage},
          { path: 'info', name: "info", component: InfoPage},
          { path: 'user', name: "user", component: UserPage},
          { path: 'upload', name: "upload", component: UploadModal},
          { path: 'games', name: "games", component: GamesPage },
          { path: 'games/guess-song', name: "guess-song", component: GuessSongGame },
          { path: 'games/lyrics-chain', name: "lyrics-chain", component: LyricsChainGame },
          { path: 'games/quiz', name: "quiz", component: QuizGame }
        ]
    }
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