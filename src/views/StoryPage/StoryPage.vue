<template>
    <div class="story-page">
        <div class="page-header">
            <h1 class="page-title">
                <i class="fab fa-instagram"></i> IG 快拍
            </h1>
            <p class="page-subtitle">G.E.M. Instagram Stories 自动同步</p>
        </div>

        <div class="story-grid">
            <!-- 骨架屏 -->
            <template v-if="loading && storyList.length === 0">
                <div class="skeleton-card" v-for="n in 6" :key="'sk-' + n">
                    <div class="skeleton-media skeleton-pulse"></div>
                    <div class="skeleton-info">
                        <div class="skeleton-line skeleton-pulse" style="width:60%"></div>
                        <div class="skeleton-badge skeleton-pulse"></div>
                    </div>
                </div>
            </template>

            <StoryCard
                v-for="story in storyList"
                :key="story.id"
                :story="story"
                :base-url="apiBaseUrl"
            />
        </div>

        <!-- 加载更多 -->
        <div class="load-more-container" v-if="!noMore">
            <button class="load-more-btn" @click="loadMore" :disabled="loading">
                <span v-if="loading" class="loading-spinner"></span>
                {{ loading ? '加载中...' : '加载更多' }}
            </button>
        </div>
        <div class="no-more-container" v-else-if="storyList.length > 0">
            <div class="no-more">
                <span class="no-more-icon">✨</span> 没有更多快拍了~
            </div>
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-if="!loading && storyList.length === 0 && noMore">
            <i class="fab fa-instagram empty-icon"></i>
            <p>暂无快拍内容</p>
            <span>快拍会在 G.E.M. 发布后自动同步</span>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import apiClient from '@/utils/api';
import StoryCard from '@/components/story/StoryCard.vue';

const apiBaseUrl = import.meta.env.VITE_API_BASEURL + (import.meta.env.VITE_API_PREFIX || '');
const storyList = ref([]);
const loading = ref(false);
const noMore = ref(false);
const currentPage = ref(0);
const pageSize = 12;
const isMounted = ref(true);

const loadMore = async () => {
    if (loading.value || noMore.value) return;
    loading.value = true;
    try {
        const resp = await apiClient.get('/story/list', {
            params: { page: currentPage.value, size: pageSize }
        });
        if (!isMounted.value) return;
        const page = resp.data.data;
        const items = page.content || [];
        if (items.length < pageSize || page.last) noMore.value = true;
        storyList.value.push(...items);
        currentPage.value++;
    } catch (e) {
        console.error('加载快拍失败:', e);
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
    isMounted.value = true;
    window.scrollTo(0, 0);
    await loadMore();
});
onUnmounted(() => { isMounted.value = false; });
</script>

<style scoped>
.story-page {
    min-height: 100vh;
    padding: calc(var(--nav-height, 70px) + 2rem) 1rem 2rem;
    background: var(--bg-dark);
    background-image:
        radial-gradient(circle at 20% 20%, rgba(235,7,238,0.1), transparent 40%),
        radial-gradient(circle at 80% 80%, rgba(0,242,255,0.1), transparent 40%);
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    color: #fff;
}
.page-header { text-align: center; margin-bottom: 2rem; }
.page-title {
    font-size: 2rem; font-weight: 800;
    background: linear-gradient(135deg, #fff, #f3caff);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    display: flex; align-items: center; justify-content: center; gap: 0.8rem;
}
.page-title i { -webkit-text-fill-color: #eb07ee; font-size: 1.8rem; }
.page-subtitle { color: rgba(255,255,255,0.5); font-size: 0.9rem; margin-top: 0.5rem; }

.story-grid {
    width: 100%; max-width: 1400px; margin: 0 auto;
    display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2rem; padding: 1rem; box-sizing: border-box;
}

/* 骨架屏 */
.skeleton-card {
    border-radius: 20px; overflow: hidden;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
}
.skeleton-media { width: 100%; aspect-ratio: 9/16; }
.skeleton-info { padding: 1rem 1.2rem; display: flex; justify-content: space-between; align-items: center; }
.skeleton-line { height: 14px; border-radius: 6px; }
.skeleton-badge { width: 50px; height: 24px; border-radius: 20px; }
@keyframes skeletonPulse { 0%{opacity:.4} 50%{opacity:.15} 100%{opacity:.4} }
.skeleton-pulse { animation: skeletonPulse 1.5s ease-in-out infinite; background: rgba(255,255,255,0.08); }

/* 加载更多 */
.load-more-container { width: 100%; display: flex; justify-content: center; margin: 3rem 0; padding: 1rem; }
.load-more-btn {
    background: linear-gradient(135deg, #eb07ee, #a505de); color: #fff; border: none;
    padding: 0.8rem 3rem; border-radius: 50px; font-size: 1rem; font-weight: 600;
    cursor: pointer; transition: all .3s ease;
    box-shadow: 0 10px 20px rgba(235,7,238,0.3); overflow: hidden;
}
.load-more-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(235,7,238,0.5); }
.load-more-btn:disabled { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); cursor: not-allowed; box-shadow: none; }
.loading-spinner {
    display: inline-block; width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff;
    animation: spin 1s ease-in-out infinite; margin-right: 8px; vertical-align: middle;
}
@keyframes spin { to { transform: rotate(360deg); } }

.no-more-container { width: 100%; display: flex; justify-content: center; margin: 3rem 0; }
.no-more {
    text-align: center; color: rgba(255,255,255,0.5); font-size: 0.9rem;
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.6rem 1.5rem; background: rgba(255,255,255,0.05);
    border-radius: 50px; border: 1px solid rgba(255,255,255,0.05);
}

/* 空状态 */
.empty-state {
    text-align: center; padding: 4rem 2rem; color: rgba(255,255,255,0.5);
}
.empty-icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.3; display: block; }
.empty-state p { font-size: 1.2rem; margin-bottom: 0.5rem; color: rgba(255,255,255,0.7); }
.empty-state span { font-size: 0.9rem; }

/* 响应式 */
@media (max-width: 1024px) {
    .story-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.5rem; }
}
@media (max-width: 768px) {
    .story-page { padding: calc(var(--nav-height, 70px) + 1rem) 1rem 1rem; }
    .story-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .page-title { font-size: 1.5rem; }
}
@media (max-width: 480px) {
    .story-grid { grid-template-columns: repeat(2, 1fr); gap: 0.8rem; padding: 0.5rem; }
}
</style>
