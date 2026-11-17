<template>
    <div class="quote-page">
        <!-- 顶部 Tab -->
        <div class="quote-tabs">
            <button
                v-for="tab in tabs"
                :key="tab.value"
                :class="['quote-tab', { active: currentTab === tab.value }]"
                @click="switchTab(tab.value)"
            >
                <span class="tab-icon">{{ tab.icon }}</span>
                <span class="tab-label">{{ tab.label }}</span>
            </button>
        </div>

        <!-- 骨架屏：首次加载时 -->
        <div v-if="loading && quoteList.length === 0" class="skeleton-grid">
            <div class="quote-item skeleton-item" v-for="n in 6" :key="'skeleton-' + n">
                <div class="skeleton-picture skeleton-pulse"></div>
                <div class="skeleton-text">
                    <div class="skeleton-line skeleton-pulse" style="width: 90%"></div>
                    <div class="skeleton-line skeleton-pulse" style="width: 70%"></div>
                    <div class="skeleton-line skeleton-pulse" style="width: 50%"></div>
                </div>
                <div class="skeleton-user">
                    <div class="skeleton-avatar skeleton-pulse"></div>
                    <div class="skeleton-name skeleton-pulse"></div>
                </div>
            </div>
        </div>

        <!-- Masonry 瀑布流（基于 @yeger/vue-masonry-wall） -->
        <MasonryWall
            v-else
            :items="displayList"
            :column-width="masonryColumnWidth"
            :gap="masonryGap"
            :rtl="false"
            :ssr-columns="3"
            :key-mapper="quoteKeyMapper"
            class="quote-list"
        >            <template #default="{ item: quote }">
                <!-- 置顶卡片（直接展开社区简介） -->
                <div
                    v-if="quote._isPinned"
                    class="quote-item pinned-item"
                >
                    <span class="pinned-badge">📌 置顶</span>
                    <div class="pinned-title">👋 嗨，欢迎来广场</div>
                    <div class="pinned-sub">目前都是站长的一些碎碎念，欢迎发帖</div>
                    <div class="pinned-rules-title">👇 几个小约定</div>
                    <ul class="pinned-rules">
                        <li>不拉踩不引战，维护网络环境人人有责</li>
                        <li>站长一个人维护，没做审核机制</li>
                        <li>不当内容我会手动删除，请大家自觉</li>
                    </ul>
                </div>
                <div v-else class="quote-item" :key="quote.quoteInfo.quoteId">
                    <div
                        v-if="quote.pictureList.length > 0 || (!quote._pictureLoaded && quote._hasPicture)"
                        class="quote-item-content-picture"
                        @click="goToQuoteDetail(quote.quoteInfo.quoteId)"
                    >
                        <div class="quote-item-content-picture-item" v-for="(picture, pictureIndex) in quote.pictureList" :key="pictureIndex">
                            <img :src="picture" alt="quote-picture">
                        </div>
                        <div v-if="quote.pictureList.length === 0 && !quote._pictureLoaded" class="picture-placeholder skeleton-pulse"></div>
                    </div>
                    <div class="quote-item-content" @click="goToQuoteDetail(quote.quoteInfo.quoteId)">
                        <div class="quote-item-content-text">
                            <div class="quote-item-content-text-content">
                                {{ quote.quoteInfo.content }}
                            </div>
                        </div>
                    </div>
                    <div class="quote-item-content-user">
                        <div class="quote-item-content-user-avatar" @click.stop="goToUserPage(quote.quoteInfo.userId)">
                            <img v-if="quote.userAvatar" :src="quote.userAvatar" alt="user-avatar" loading="lazy">
                            <div v-else class="avatar-placeholder skeleton-pulse"></div>
                        </div>
                        <div class="quote-item-content-user-nickname">
                            {{ quote.userNickName || '加载中...' }}
                        </div>
                        <div class="quote-item-content-like" @click.stop="addlike(quote)">
                            <span :class="['like-icon', { 'liked': quote.isliked }]">
                                <span v-if="quote.isliked">❤️</span>
                                <span v-else>🤍</span>
                            </span>
                            <div class="quote-item-content-like-count">
                                <transition name="like-num" mode="out-in">
                                    <span :key="quote.quoteInfo.likesCount">{{ quote.quoteInfo.likesCount }}</span>
                                </transition>
                                <span v-if="quote._likeBurst" class="like-burst">+1</span>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </MasonryWall>

        <!-- 发帖悬浮按钮 FAB -->
        <button class="post-fab" @click="goToUpload" aria-label="发帖">
            <span class="fab-icon">✍️</span>
            <span class="fab-label">发帖</span>
        </button>

        <!-- 加载更多 / 没有更多 -->
        <div class="load-more-container" v-if="!noMoreQuotes">
            <button
                class="load-more-btn"
                @click="loadMoreQuotes"
                :disabled="loading"
            >
                <span v-if="loading" class="loading-spinner"></span>
                {{ loading ? '加载中...' : '加载更多' }}
            </button>
        </div>
        <div class="no-more-container" v-else>
            <div class="no-more">
                <span class="no-more-icon">✨</span>
                没有更多内容了~
            </div>
        </div>

        <!-- Quote 详情弹窗 -->
        <QuoteInfoPage
            v-model:visible="showQuoteModal"
            :quote-id="selectedQuoteId"
        />

        <!-- 发帖弹窗 -->
        <transition name="upload-fade">
            <div v-if="showUploadModal" class="upload-overlay" @click.self="closeUploadModal">
                <div class="upload-overlay-inner">
                    <button class="upload-close" @click="closeUploadModal" aria-label="关闭">✕</button>
                    <UploadModal />
                </div>
            </div>
        </transition>

        <!-- 登录弹窗 -->
        <LoginModal ref="loginModalRef" />
    </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import apiClient from '@/utils/api';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
import QuoteInfoPage from './QuoteInfoPage.vue';
import { showUserCard } from '@/utils/userCardStore';
import LoginModal from '@/components/Login/LoginModal.vue';
import UploadModal from '@/components/upload/UploadModal.vue';
import { showToast } from '@/utils/toast';
import MasonryWall from '@yeger/vue-masonry-wall';

const loginModalRef = ref<any>(null);
const showUploadModal = ref(false);

// 响应式列宽 / 间距
const isMobile = ref(false);
const masonryColumnWidth = ref(320);
const masonryGap = ref(16);
const updateMasonryConfig = () => {
    const w = window.innerWidth;
    isMobile.value = w <= 768;
    if (w <= 360)      { masonryColumnWidth.value = 150; masonryGap.value = 8; }
    else if (w <= 768) { masonryColumnWidth.value = 165; masonryGap.value = 10; }
    else if (w <= 1024){ masonryColumnWidth.value = 280; masonryGap.value = 14; }
    else               { masonryColumnWidth.value = 320; masonryGap.value = 16; }
};
updateMasonryConfig();

// 给 MasonryWall 一个稳定 key，让 DOM 节点在重排时被复用（避免图片重新加载）
const quoteKeyMapper = (item: any) => item?._isPinned ? `pin-${item.id}` : item?.quoteInfo?.quoteId;

const router = useRouter();
const userStore = useUserStore();
const isMounted = ref(true);
// 防止 tab 快速切换时老请求的异步回调覆盖新数据
let loadGen = 0;

interface QuoteInfo{
    quoteId: number;
    commentsCount: number;
    likesCount: number;
    content: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
}

interface Quote {
    quoteInfo: QuoteInfo;
    userNickName: string;
    userAvatar: string;
    pictureList: string[];
    isliked: boolean;
    _pictureLoaded?: boolean;
    _hasPicture?: boolean;
    _picturePaths?: string[];
    _userAvatarPath?: string;
    _likeBurst?: boolean;
    _likeBusy?: boolean;
}

const quoteList = ref<Quote[]>([]);
const showQuoteModal = ref(false);
const selectedQuoteId = ref('');
const loading = ref(false);
const noMoreQuotes = ref(false);
const batchSize = 6;

// 顶部 Tab
const tabs = [
    { value: 'random', label: '推荐', icon: '✨' },
    { value: 'latest', label: '最新', icon: '🕛' },
    { value: 'hot',    label: '热门', icon: '🔥' }
];
const currentTab = ref<'random' | 'latest' | 'hot'>('random');

// 置顶配置（写死，要改直接编辑这个数组）
interface PinnedItem {
    _isPinned: true;
    id: string;
    showOn?: Array<'random' | 'latest' | 'hot'>; // 在哪些 tab 显示，默认全部
}
const pinnedItems: PinnedItem[] = [
    { _isPinned: true, id: 'pinned-welcome' },
];

// 当前 tab 下应展示的置顶 + 帖子拼接列表
const displayList = computed(() => {
    const pins = pinnedItems.filter(p => !p.showOn || p.showOn.includes(currentTab.value));
    return [...pins, ...quoteList.value];
});

const switchTab = async (val: string) => {
    if (currentTab.value === val) return;
    currentTab.value = val as any;
    // 作废上一轮请求的异步回调
    loadGen++;
    loading.value = false;
    quoteList.value = [];
    noMoreQuotes.value = false;
    await loadMoreQuotes();
};

const goToUpload = () => {
    if (!userStore.isLoggedIn) {
        showToast('请先登录后再发帖 ✨', 'warning');
        loginModalRef.value?.openModal();
        return;
    }
    showUploadModal.value = true;
};
const closeUploadModal = () => { showUploadModal.value = false; };

// 获取已显示的 Quote IDs
const getDisplayedQuoteIds = () => {
    return quoteList.value.map(quote => quote.quoteInfo.quoteId);
};

// 加载更多 Quotes — 使用后端聚合接口，1 次请求拿到所有数据
const loadMoreQuotes = async () => {
    if (loading.value || noMoreQuotes.value) return;

    const myGen = loadGen;
    loading.value = true;
    try {
        const displayedIds = getDisplayedQuoteIds();
        // 调用聚合接口：一次性返回语录 + 用户信息 + 图片路径 + 点赞状态
        const response = await apiClient.post('/quote/getMoreQuoteCards', {
            displayedIds: displayedIds,
            count: batchSize,
            currentUserId: userStore.isLoggedIn ? userStore.userId : null,
            sort: currentTab.value
        });

        if (!isMounted.value || myGen !== loadGen) return;

        const cards = response.data.data;
        
        if (cards.length < batchSize) {
            noMoreQuotes.value = true;
        }

        // 先将卡片数据（文字+昵称）渲染到页面
        const quotes: Quote[] = cards.map((card: any) => ({
            quoteInfo: card.quoteInfo,
            userNickName: card.userNickName,
            userAvatar: '',       // 图片稍后异步加载
            pictureList: [],      // 图片稍后异步加载
            isliked: card.liked,
            _pictureLoaded: card.picturePaths.length === 0,
            _hasPicture: card.picturePaths.length > 0,
            _picturePaths: card.picturePaths,
            _userAvatarPath: card.userAvatarPath
        }));

        const startIndex = quoteList.value.length;
        quoteList.value.push(...quotes);
        loading.value = false;

        // 异步并行加载所有图片 blob（头像 + 语录图片）
        // 关键：必须从 quoteList.value 中取响应式代理对象来修改，否则 Vue 无法检测变更
        await Promise.all(quotes.map(async (rawQuote: any, i: number) => {
            // 每次回调之前检查代际（tab 可能已切换、列表已被清空）
            if (myGen !== loadGen || !isMounted.value) return;
            const reactiveQuote = quoteList.value[startIndex + i];
            if (!reactiveQuote || reactiveQuote.quoteInfo.quoteId !== rawQuote.quoteInfo.quoteId) return;
            try {
                const imagePromises: Promise<void>[] = [];

                // 用户头像（缩略图 80px）
                if (rawQuote._userAvatarPath) {
                    imagePromises.push(
                        apiClient.getImageUrl(rawQuote._userAvatarPath, 80).then((url: string) => {
                            if (isMounted.value && myGen === loadGen) reactiveQuote.userAvatar = url;
                        }).catch(() => {})
                    );
                }

                // 语录图片（列表只加载第一张，缩略图 400px）
                if (rawQuote._picturePaths && rawQuote._picturePaths.length > 0) {
                    imagePromises.push(
                        apiClient.getImageUrl(rawQuote._picturePaths[0], 400).then((url: string) => {
                            if (isMounted.value && myGen === loadGen) {
                                reactiveQuote.pictureList = [url];
                                reactiveQuote._pictureLoaded = true;
                            }
                        }).catch(() => { reactiveQuote._pictureLoaded = true; })
                    );
                }

                await Promise.all(imagePromises);
            } catch (e) {
                reactiveQuote._pictureLoaded = true;
            }
        }));
    } catch (error) {
        console.error('加载更多 Quotes 失败:', error);
        loading.value = false;
    }
};

// 初始加载
onMounted(async () => {
    isMounted.value = true;
    window.scrollTo(0, 0);
    window.addEventListener('resize', updateMasonryConfig);
    await loadMoreQuotes();
});

onUnmounted(() => {
    isMounted.value = false;
    window.removeEventListener('resize', updateMasonryConfig);
});

// 点赞 —— 不做乐观更新，以服务端返回的 likesCount 为唯一真相
const addlike = async (quote: Quote) => {
    if (!userStore.isLoggedIn) {
        showToast('请先登录后再点赞 ✨', 'warning');
        loginModalRef.value?.openModal();
        return;
    }
    if ((quote as any)._likeBusy) return; // 防连点 race
    (quote as any)._likeBusy = true;

    const before = quote.isliked;
    const url = before ? '/quote/eraseLike' : '/quote/addLike';

    try {
        const res = await apiClient.post(url, null, {
            params: { quoteId: quote.quoteInfo.quoteId, userId: userStore.userId }
        });
        quote.isliked = !before;
        const latest = res?.data?.data;
        if (typeof latest === 'number') {
            quote.quoteInfo.likesCount = latest;
        }
        // +1 飞出动画（仅点赞时触发，取消点赞不触发）
        if (!before) {
            (quote as any)._likeBurst = true;
            setTimeout(() => { (quote as any)._likeBurst = false; }, 700);
        }
    } catch {
        // 失败时不动状态
    } finally {
        (quote as any)._likeBusy = false;
    }
};

const goToUserPage = (userId: string) => {
    showUserCard(userId);
};

const goToQuoteDetail = (quoteId: number) => {
    selectedQuoteId.value = String(quoteId);
    showQuoteModal.value = true;
};
</script>

<style scoped>
.quote-page {
    min-height: 100vh;
    padding: var(--page-padding-y) var(--page-padding-x) var(--page-padding-bottom);
    background: transparent;
    position: relative;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    color: var(--text-primary);
}

/* ============ 顶部 Tab ============ */
.quote-tabs {
    position: relative;
    z-index: 10;
    align-self: center;
    display: flex;
    width: max-content;
    max-width: 100%;
    gap: 0.5rem;
    padding: 0.5rem 0.6rem;
    margin: 0 auto 1.2rem;
    background: rgba(20, 20, 30, 0.55);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
}
.quote-tab {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem 1.1rem;
    border-radius: 999px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
    white-space: nowrap;
}
.quote-tab:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.06);
}
.quote-tab.active {
    color: #fff;
    background: linear-gradient(135deg, #eb07ee, #7d4dff);
    box-shadow: 0 4px 14px rgba(235, 7, 238, 0.4);
}
.tab-icon { font-size: 1rem; }
@media (max-width: 768px) {
    .quote-tabs { padding: 0.4rem 0.5rem; gap: 0.3rem; }
    .quote-tab { padding: 0.35rem 0.8rem; font-size: 0.82rem; }
    .tab-icon { font-size: 0.85rem; }
}

/* ============ 发帖 FAB ============ */
.post-fab {
    position: fixed;
    /* 跟随列表右边：让它在 max-width 1400 的内容区右侧 */
    right: max(1.5rem, calc((100vw - 1400px) / 2 + 1.5rem));
    bottom: 5.5rem;
    z-index: 99;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.85rem 1.3rem;
    border: none;
    border-radius: 999px;
    background: linear-gradient(135deg, #eb07ee, #7d4dff);
    color: #fff;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 10px 30px rgba(235, 7, 238, 0.45);
    transition: transform 0.25s var(--ease-out), box-shadow 0.25s var(--ease-out);
    animation: fabPulse 2.4s ease-in-out infinite;
}
.post-fab:hover {
    transform: translateY(-3px) scale(1.04);
    box-shadow: 0 15px 36px rgba(235, 7, 238, 0.6);
}
.post-fab:active { transform: translateY(0) scale(0.97); }
.fab-icon { font-size: 1.15rem; }
@keyframes fabPulse {
    0%, 100% { box-shadow: 0 10px 30px rgba(235, 7, 238, 0.45); }
    50%      { box-shadow: 0 10px 30px rgba(235, 7, 238, 0.75), 0 0 0 8px rgba(235, 7, 238, 0.08); }
}
@media (max-width: 768px) {
    .post-fab {
        right: 1rem;
        bottom: 4.5rem;
        padding: 0.7rem 1rem;
        font-size: 0.9rem;
    }
    .fab-label { display: none; } /* 移动端只剩图标 */
    .post-fab { padding: 0.85rem; border-radius: 50%; }
}

/* ============ 点赞数动画 ============ */
.quote-item-content-like-count {
    position: relative;
    display: inline-flex;
    align-items: center;
    min-width: 1.5em;
}
.like-num-enter-active,
.like-num-leave-active {
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    display: inline-block;
}
.like-num-enter-from {
    opacity: 0;
    transform: translateY(-12px) scale(0.6);
}
.like-num-leave-to {
    opacity: 0;
    transform: translateY(12px) scale(0.6);
    position: absolute;
}
.like-burst {
    position: absolute;
    right: -2px;
    top: -4px;
    color: #ff5fb1;
    font-size: 0.85rem;
    font-weight: 800;
    pointer-events: none;
    animation: likeBurst 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    text-shadow: 0 2px 6px rgba(255, 95, 177, 0.6);
}
@keyframes likeBurst {
    0%   { opacity: 0; transform: translateY(0) scale(0.6); }
    30%  { opacity: 1; transform: translateY(-12px) scale(1.1); }
    100% { opacity: 0; transform: translateY(-30px) scale(1); }
}

.quote-list {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    box-sizing: border-box;
    padding: var(--space-4);
}

.skeleton-grid {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.2rem;
    padding: var(--space-4);
}
@media (max-width: 768px) {
    .skeleton-grid { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; padding: 0.5rem; }
}

.quote-item {
    background: var(--surface-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border-radius: var(--card-radius);
    box-shadow: var(--shadow-md);
    padding: var(--card-padding);
    transition: all 0.3s var(--ease-out);
    cursor: pointer;
    border: 1px solid var(--surface-border);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    width: 100%;
}

@media (max-width: 1024px) { .quote-item { } }
@media (max-width: 768px)  { .quote-item { } }

.quote-item:hover {
    transform: translateY(-6px);
    box-shadow: var(--shadow-primary);
    border-color: var(--surface-border-hover);
    background: var(--surface-bg-hover);
}

.quote-item-content {
    display: flex;
    flex-direction: column;
}

.quote-item-content-text {
    margin: 0.6rem 0 1rem;
}

.quote-item-content-text-content {   
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    font-weight: 400;
    letter-spacing: 0.5px;
}

.quote-item-content-picture {
    display: block;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 1rem;
}

.quote-item-content-picture-item {
    width: 100%;
    overflow: hidden;
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.quote-item-content-picture-item img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
    transition: transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.quote-item:hover .quote-item-content-picture-item img {
    transform: scale(1.1);
}

/* 用户信息部分样式 */
.quote-item-content-user {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50px;
    padding: 0.5rem 0.8rem 0.5rem 0.5rem;
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
}

.quote-item:hover .quote-item-content-user {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.1);
}

.quote-item-content-user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 0.8rem;
    border: 2px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
}

.quote-item-content-user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.quote-item-content-user:hover .quote-item-content-user-avatar {
    border-color: #eb07ee;
    transform: scale(1.1);
}

.quote-item-content-user-nickname {
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    margin-right: auto;
}

/* 点赞量样式 */
.quote-item-content-like {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
}

.quote-item-content-like:hover {
    background: rgba(235, 7, 238, 0.2);
}

.like-icon {
    font-size: 1rem;
    transition: transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

.like-icon.liked {
    transform: scale(1.2);
    animation: heartBeat 0.3s ease-in-out;
}

@keyframes heartBeat {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1.2); }
}

.quote-item-content-like-count {
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
}

/* 加载更多按钮 */
.load-more-container {
    width: 100%;
    display: flex;
    justify-content: center;
    margin: var(--space-12) 0;
    padding: var(--space-4);
}

.load-more-btn {
    background: var(--color-brand-gradient);
    color: white;
    border: none;
    min-height: var(--button-height);
    padding: 0 var(--space-12);
    border-radius: var(--radius-pill);
    font-size: var(--text-base);
    font-weight: 700;
    cursor: pointer;
    transition: all 0.25s var(--ease-out);
    box-shadow: var(--shadow-primary);
    position: relative;
    overflow: hidden;
}

.load-more-btn:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 15px 30px rgba(235, 7, 238, 0.5);
}

.load-more-btn:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
    box-shadow: none;
}

.loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
    margin-right: 8px;
    vertical-align: middle;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.no-more-container {
    width: 100%;
    display: flex;
    justify-content: center;
    margin: var(--space-12) 0;
}

.no-more {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-6);
    background: var(--surface-bg);
    border-radius: var(--radius-pill);
    border: 1px solid var(--surface-border);
}

/* 响应式布局（Masonry 列数控制已在 .quote-list 原位上面与 media 中设置）*/
@media (max-width: 768px) {
    .quote-page {
        padding: var(--page-padding-y) var(--space-1) var(--page-padding-bottom);
    }

    .quote-item {
        padding: 0.55rem;
        border-radius: 12px;
    }

    .quote-item:hover { transform: none; }
    .quote-item-content { padding: 0; }
    .quote-item-content-text { margin: 0.45rem 0; }
    .quote-item-content-text-content {
        font-size: 0.78rem;
        line-height: 1.4;
        -webkit-line-clamp: 2;
        letter-spacing: 0;
    }
    .quote-item-content-picture { margin-bottom: 0.45rem; gap: 0.3rem; border-radius: 10px; }
    .quote-item-content-picture-item img { border-radius: 8px; }
    .quote-item-content-user {
        padding: 0.22rem 0.4rem 0.22rem 0.22rem;
        border-radius: 30px;
    }
    .quote-item-content-user-avatar {
        width: 22px;
        height: 22px;
        margin-right: 0.3rem;
        border-width: 1px;
    }
    .quote-item-content-user-nickname {
        font-size: 0.7rem;
        max-width: 54px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .quote-item-content-like {
        padding: 0.18rem 0.35rem;
        gap: 0.18rem;
    }
    .like-icon { font-size: 0.8rem; }
    .quote-item-content-like-count { font-size: 0.7rem; }
    .load-more-container, .no-more-container { margin: var(--space-5) 0; }
}

@media (max-width: 360px) {
    .quote-item { padding: 0.45rem; }
    .quote-item-content-text-content {
        -webkit-line-clamp: 2;
        font-size: 0.74rem;
    }
    .quote-item-content-user-nickname { max-width: 48px; font-size: 0.68rem; }
    .quote-item-content-user-avatar { width: 20px; height: 20px; }
}

/* 骨架屏动画 */
@keyframes skeletonPulse {
    0% { opacity: 0.4; }
    50% { opacity: 0.15; }
    100% { opacity: 0.4; }
}

.skeleton-pulse {
    animation: skeletonPulse 1.5s ease-in-out infinite;
    background: rgba(255, 255, 255, 0.08);
}

.skeleton-item {
    pointer-events: none;
}

.skeleton-picture {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 12px;
    margin-bottom: 1rem;
}

.skeleton-text {
    padding: 0.5rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin-bottom: 1rem;
}

.skeleton-line {
    height: 14px;
    border-radius: 6px;
}

.skeleton-user {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.5rem;
}

.skeleton-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    flex-shrink: 0;
}

.skeleton-name {
    height: 14px;
    width: 80px;
    border-radius: 6px;
}

/* 图片加载占位 */
.picture-placeholder {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.avatar-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 50%;
}

/* ============ 置顶卡片 ============ */
.pinned-item {
    position: relative;
    display: flex;
    flex-direction: column;
    text-decoration: none;
    color: inherit;
    background: linear-gradient(135deg, rgba(235, 7, 238, 0.18), rgba(125, 77, 255, 0.18));
    border: 1px solid rgba(235, 7, 238, 0.45);
    box-shadow: 0 8px 24px rgba(235, 7, 238, 0.25);
}
.pinned-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 2;
    padding: 3px 10px;
    border-radius: 999px;
    background: linear-gradient(135deg, #eb07ee, #7d4dff);
    color: #fff;
    font-size: 0.72rem;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(235, 7, 238, 0.5);
}
.pinned-badge-anchor { display: none; }
@media (max-width: 768px) {
    .pinned-badge { font-size: 0.6rem; padding: 2px 7px; }
}

@media (max-width: 768px) {
    .pinned-title { font-size: 0.95rem; }
    .pinned-sub { font-size: 0.7rem; }
    .pinned-intro { font-size: 0.78rem; }
    .pinned-rules-title { font-size: 0.78rem; }
    .pinned-rules li { font-size: 0.74rem; }
    .pinned-sign { font-size: 0.72rem; }
    .pinned-badge { font-size: 0.6rem; padding: 2px 7px; }
}

.pinned-title {
    font-size: 1.1rem;
    font-weight: 700;
    margin-top: 1.2rem;
    background: linear-gradient(135deg, #eb07ee, #7d4dff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
.pinned-sub {
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.55);
    margin-top: 0.2rem;
    margin-bottom: 0.7rem;
}
.pinned-intro {
    font-size: 0.85rem;
    line-height: 1.65;
    color: rgba(255, 255, 255, 0.85);
    margin: 0 0 0.9rem;
}
.pinned-rules-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #ff6ff0;
    margin-bottom: 0.4rem;
}
.pinned-rules {
    margin: 0 0 0.8rem;
    padding-left: 1.1rem;
}
.pinned-rules li {
    font-size: 0.82rem;
    line-height: 1.75;
    color: rgba(255, 255, 255, 0.78);
}
.pinned-sign {
    font-size: 0.78rem;
    color: #ff6ff0;
    font-style: italic;
    text-align: right;
    margin-top: 0.4rem;
}

/* ============ 发帖弹窗 ============ */
.upload-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    overflow-y: auto;
    padding: calc(var(--nav-height, 70px) + var(--safe-area-top, 0px) + 24px) 16px 40px;
}
.upload-overlay-inner {
    position: relative;
    width: 100%;
    max-width: 820px;
    background: rgba(20, 20, 30, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    overflow: hidden;
}
.upload-close {
    position: absolute;
    top: 14px;
    right: 14px;
    z-index: 2;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
}
.upload-close:hover { background: rgba(235, 7, 238, 0.4); transform: rotate(90deg); }

/* 弹窗里的 UploadModal 不再需要顶部导航占位 */
.upload-overlay-inner :deep(.upload-modal) {
    padding: 24px;
}

@media (max-width: 768px) {
    .upload-overlay {
        padding: calc(var(--nav-height, 70px) + var(--safe-area-top, 0px) + 12px) 8px 24px;
    }
    .upload-overlay-inner {
        border-radius: 14px;
    }
    .upload-close {
        top: 10px;
        right: 10px;
        width: 30px;
        height: 30px;
        font-size: 0.9rem;
    }
    .upload-overlay-inner :deep(.upload-modal) {
        padding: 14px 12px;
    }
}

.upload-fade-enter-active,
.upload-fade-leave-active { transition: opacity 0.25s ease; }
.upload-fade-enter-from,
.upload-fade-leave-to { opacity: 0; }
.upload-fade-enter-active .upload-overlay-inner,
.upload-fade-leave-active .upload-overlay-inner { transition: transform 0.25s var(--ease-out); }
.upload-fade-enter-from .upload-overlay-inner { transform: translateY(20px); }
.upload-fade-leave-to .upload-overlay-inner { transform: translateY(20px); }
</style>
