<template>
    <div class="story-page">
        <div class="page-header">
            <h1 class="page-title">
                <i class="fab fa-instagram"></i> IG 快拍
            </h1>
<p class="page-subtitle">G.E.M. Instagram Stories (测试中)</p>
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
                @open="openViewer"
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
        </div>

        <!-- ========== 全屏查看器 ========== -->
        <Teleport to="body">
            <Transition name="viewer-fade">
                <div class="story-viewer-overlay" v-if="viewerStory" @click.self="closeViewer">
                    <!-- 关闭按钮 -->
                    <button class="viewer-close" @click="closeViewer">
                        <i class="fas fa-times"></i>
                    </button>

                    <!-- 左右切换 -->
                    <button class="viewer-nav viewer-prev" v-if="viewerIndex > 0" @click.stop="prevStory">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="viewer-nav viewer-next" v-if="viewerIndex < storyList.length - 1" @click.stop="nextStory">
                        <i class="fas fa-chevron-right"></i>
                    </button>

                    <!-- 媒体容器 -->
                    <div class="viewer-content" @click.stop>
                        <!-- 视频 -->
                        <video
                            v-if="viewerStory.mediaType === 2"
                            ref="viewerVideoRef"
                            class="viewer-media"
                            :src="viewerMediaUrl"
                            autoplay
                            loop
                            playsinline
                            webkit-playsinline
                            x5-playsinline
                            x5-video-player-type="h5-page"
                            x5-video-player-fullscreen="false"
                            x5-video-orientation="portrait"
                            t7-video-player-type="inline"
                            controls
                        />
                        <!-- 图片 -->
                        <img
                            v-else
                            class="viewer-media"
                            :src="viewerMediaUrl"
                            alt="story"
                        />

                        <!-- 底部信息 -->
                        <div class="viewer-info">
                            <div class="viewer-time">
                                <i class="fas fa-clock"></i>
                                {{ viewerFormattedTime }}
                            </div>
                            <div class="viewer-counter">
                                {{ viewerIndex + 1 }} / {{ storyList.length }}
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import apiClient from '@/utils/api';
import StoryCard from '@/components/story/StoryCard.vue';

const apiBaseUrl = import.meta.env.VITE_API_BASEURL + (import.meta.env.VITE_API_PREFIX || '');
const storyList = ref([]);
const loading = ref(false);
const noMore = ref(false);
const currentPage = ref(0);
const pageSize = 8;
const isMounted = ref(true);

// ---- 全屏查看器状态 ----
const viewerStory = ref(null);
const viewerIndex = ref(-1);
const viewerVideoRef = ref(null);

const viewerMediaUrl = computed(() => {
    if (!viewerStory.value) return '';
    return `${apiBaseUrl}/story/media?path=${encodeURIComponent(viewerStory.value.filePath)}`;
});

const viewerFormattedTime = computed(() => {
    if (!viewerStory.value?.takenAt) return '';
    const date = new Date(viewerStory.value.takenAt);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
});

function openViewer(story) {
    const idx = storyList.value.findIndex(s => s.id === story.id);
    viewerIndex.value = idx >= 0 ? idx : 0;
    viewerStory.value = story;
    document.body.style.overflow = 'hidden';
}

function closeViewer() {
    if (viewerVideoRef.value) viewerVideoRef.value.pause();
    viewerStory.value = null;
    viewerIndex.value = -1;
    document.body.style.overflow = '';
}

function prevStory() {
    if (viewerIndex.value > 0) {
        viewerVideoRef.value?.pause();
        viewerIndex.value--;
        viewerStory.value = storyList.value[viewerIndex.value];
    }
}

function nextStory() {
    if (viewerIndex.value < storyList.value.length - 1) {
        viewerVideoRef.value?.pause();
        viewerIndex.value++;
        viewerStory.value = storyList.value[viewerIndex.value];
    }
}

// 键盘导航
function onKeydown(e) {
    if (!viewerStory.value) return;
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowLeft') prevStory();
    if (e.key === 'ArrowRight') nextStory();
}

// ---- 列表加载 ----
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
    window.addEventListener('keydown', onKeydown);
    await loadMore();
});
onUnmounted(() => {
    isMounted.value = false;
    window.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.story-page {
    min-height: 100vh;
    padding: var(--page-padding-y) var(--page-padding-x) var(--page-padding-bottom);
    background: transparent;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    color: var(--text-primary);
}
.page-header { text-align: center; margin-bottom: var(--space-8); }
.page-title {
    font-size: clamp(var(--text-2xl), 4vw, var(--text-3xl)); font-weight: 800;
    background: var(--color-title-gradient);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    display: flex; align-items: center; justify-content: center; gap: 0.8rem;
}
.page-title i { -webkit-text-fill-color: #D946EF; font-size: 1.8rem; }
.page-subtitle { color: var(--text-muted); font-size: var(--text-sm); margin-top: var(--space-2); }

.story-grid {
    width: 100%; max-width: 1400px; margin: 0 auto;
    display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-8); padding: var(--space-4); box-sizing: border-box;
}

/* 骨架屏（动画使用全局 .skeleton-pulse） */
.skeleton-card {
    border-radius: var(--card-radius); overflow: hidden;
    background: var(--surface-bg); border: 1px solid var(--surface-border);
}
.skeleton-media { width: 100%; aspect-ratio: 9/16; }
.skeleton-info { padding: 1rem 1.2rem; display: flex; justify-content: space-between; align-items: center; }
.skeleton-line { height: 14px; border-radius: 6px; }
.skeleton-badge { width: 50px; height: 24px; border-radius: 20px; }

/* 加载更多 */
.load-more-container { width: 100%; display: flex; justify-content: center; margin: var(--space-12) 0; padding: var(--space-4); }
.load-more-btn {
    background: var(--color-brand-gradient); color: #fff; border: none;
    min-height: var(--button-height); padding: 0 var(--space-12); border-radius: var(--radius-pill); font-size: var(--text-base); font-weight: 700;
    cursor: pointer; transition-property: transform, box-shadow; transition-duration: 0.25s; transition-timing-function: var(--ease-out);
    box-shadow: var(--shadow-primary); overflow: hidden;
}
.load-more-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(200,80,232,0.5); }
.load-more-btn:disabled { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); cursor: not-allowed; box-shadow: none; }
.loading-spinner {
    display: inline-block; width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff;
    animation: spin 1s ease-in-out infinite; margin-right: 8px; vertical-align: middle;
}
@keyframes spin { to { transform: rotate(360deg); } }

.no-more-container { width: 100%; display: flex; justify-content: center; margin: var(--space-12) 0; }
.no-more {
    text-align: center; color: var(--text-muted); font-size: var(--text-sm);
    display: flex; align-items: center; gap: var(--space-2);
    padding: var(--space-2) var(--space-6); background: var(--surface-bg);
    border-radius: var(--radius-pill); border: 1px solid var(--surface-border);
}

/* 空状态 */
.empty-state {
    text-align: center; padding: 4rem 2rem; color: rgba(255,255,255,0.5);
}
.empty-icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.3; display: block; }
.empty-state p { font-size: 1.2rem; margin-bottom: 0.5rem; color: rgba(255,255,255,0.7); }
.empty-state span { font-size: 0.9rem; }

/* ========== 全屏查看器 ========== */
.story-viewer-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.92);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    display: flex;
    align-items: center;
    justify-content: center;
}

.viewer-close {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    z-index: 10;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.1);
    color: #fff;
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition-property: transform, box-shadow, opacity;
  transition-duration: 0.3s;
  transition-timing-function: ease;
}
.viewer-close:hover {
    background: rgba(255,255,255,0.2);
    transform: rotate(90deg);
}

.viewer-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.08);
    color: #fff;
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition-property: transform, box-shadow, opacity;
  transition-duration: 0.3s;
  transition-timing-function: ease;
}
.viewer-nav:hover {
    background: rgba(200,80,232,0.3);
    border-color: rgba(200,80,232,0.5);
}
.viewer-prev { left: 1.5rem; }
.viewer-next { right: 1.5rem; }

.viewer-content {
    position: relative;
    max-width: 480px;
    width: 90vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.viewer-media {
    width: 100%;
    max-height: 80vh;
    object-fit: contain;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}

video.viewer-media {
    background: #000;
}

.viewer-info {
    margin-top: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0 0.5rem;
}

.viewer-time {
    color: rgba(255,255,255,0.6);
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.viewer-counter {
    color: rgba(255,255,255,0.4);
    font-size: 0.85rem;
    font-weight: 500;
}

/* 查看器过渡动画 */
.viewer-fade-enter-active,
.viewer-fade-leave-active {
    transition: opacity 0.3s ease;
}
.viewer-fade-enter-from,
.viewer-fade-leave-to {
    opacity: 0;
}

/* 响应式 */
@media (max-width: 1024px) {
    .story-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.5rem; }
}
@media (max-width: 768px) {
    .story-page {
        padding: var(--page-padding-y) 0 var(--page-padding-bottom);
        overflow-x: hidden;
    }
    .page-header { margin-bottom: var(--space-4); padding: 0 var(--space-3); }
    .story-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-2);
        padding: 0 var(--space-2);
        width: 100%;
        max-width: 100%;
    }
    .story-card { border-radius: 14px; }
    .story-info { padding: 0.5rem 0.6rem; }
    .story-time { font-size: 0.7rem; }
    .story-time i { font-size: 0.65rem; }
    .story-type-badge {
        font-size: 0.65rem;
        padding: 0.15rem 0.45rem;
        gap: 0.2rem;
    }
    .video-icon { width: 26px; height: 26px; top: 8px; right: 8px; }
    .video-icon i { font-size: 0.65rem; }
    .page-title { font-size: var(--text-2xl); }
    .viewer-close { top: calc(var(--safe-area-top, 0px) + 0.8rem); right: 0.8rem; }
    .viewer-nav { display: none; }
    /* 移动端给 TabBar 留出空间，避免视频控件挡住底部导航 */
    .story-viewer-overlay {
        bottom: calc(var(--tab-bar-height, 60px) + var(--safe-area-bottom, 0px));
        height: auto;
    }
    .viewer-content {
        max-width: 100vw;
        width: 100vw;
        max-height: calc(100vh - var(--tab-bar-height, 60px) - var(--safe-area-bottom, 0px));
    }
    .viewer-media {
        border-radius: 0;
        max-height: calc(100vh - var(--tab-bar-height, 60px) - var(--safe-area-bottom, 0px) - 70px);
    }
    .load-more-container, .no-more-container { margin: var(--space-6) 0; }
}
@media (max-width: 480px) {
    .story-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
        padding: 0 6px;
    }
}
</style>
