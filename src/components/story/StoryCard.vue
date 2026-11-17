<template>
    <div class="story-card" @click="$emit('open', story)">
        <!-- 视频 -->
        <div class="media-wrapper" v-if="story.mediaType === 2" ref="wrapperRef">
            <video
                ref="videoRef"
                class="story-media"
                :src="mediaUrl"
                :poster="posterUrl"
                preload="metadata"
                loop
                muted
                playsinline
                webkit-playsinline
                x5-playsinline
                x5-video-player-type="h5-page"
                x5-video-player-fullscreen="false"
                t7-video-player-type="inline"
                @loadeddata="onMediaLoaded"
            />
            <div class="video-icon">
                <i class="fas fa-play"></i>
            </div>
        </div>
        <!-- 图片 -->
        <div class="media-wrapper" v-else>
            <img
                class="story-media"
                :src="mediaUrl"
                alt="story"
                loading="lazy"
                @load="onMediaLoaded"
            />
        </div>

        <!-- 加载骨架 -->
        <div class="media-skeleton skeleton-pulse" v-if="!mediaLoaded"></div>

        <!-- 底部信息栏 -->
        <div class="story-info">
            <div class="story-time">
                <i class="fas fa-clock"></i>
                {{ formattedTime }}
            </div>
            <div class="story-type-badge" :class="story.mediaType === 2 ? 'video-badge' : 'photo-badge'">
                <i :class="story.mediaType === 2 ? 'fas fa-video' : 'fas fa-image'"></i>
                {{ story.mediaType === 2 ? '视频' : '图片' }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
    story: { type: Object, required: true },
    baseUrl: { type: String, required: true }
});

defineEmits(['open']);

const videoRef = ref(null);
const wrapperRef = ref(null);
const mediaLoaded = ref(false);
let observer = null;

const mediaUrl = computed(() => {
    // 图片列表用缩略图（thumbPath）大幅减小流量；视频卡仅作 video src，由浏览器 Range 拉取
    if (props.story.mediaType !== 2 && props.story.thumbPath) {
        return `${props.baseUrl}/story/media?path=${encodeURIComponent(props.story.thumbPath)}`;
    }
    return `${props.baseUrl}/story/media?path=${encodeURIComponent(props.story.filePath)}`;
});

const posterUrl = computed(() => {
    if (props.story.thumbPath) {
        return `${props.baseUrl}/story/media?path=${encodeURIComponent(props.story.thumbPath)}`;
    }
    return '';
});

const formattedTime = computed(() => {
    if (!props.story.takenAt) return '';
    const date = new Date(props.story.takenAt);
    if (isNaN(date.getTime())) return props.story.takenAt;
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;

    // 同年只显示 MM/DD，跨年才显示完整年月日，避免移动端拥挤
    const sameYear = date.getFullYear() === now.getFullYear();
    return date.toLocaleDateString('zh-CN', sameYear
        ? { month: '2-digit', day: '2-digit' }
        : { year: 'numeric', month: '2-digit', day: '2-digit' }
    );
});

function onMediaLoaded() {
    mediaLoaded.value = true;
}

onMounted(() => {
    if (props.story.mediaType !== 2 || !wrapperRef.value) return;

    observer = new IntersectionObserver(
        (entries) => {
            const video = videoRef.value;
            if (!video) return;
            const entry = entries[0];
            if (entry.isIntersecting) {
                // 进入视口：播放（src 一直在，滑回来 0 延迟）
                const p = video.play();
                if (p && typeof p.catch === 'function') p.catch(() => {});
            } else {
                // 离开视口：暂停（不卸载 src，避免重复加载）
                video.pause();
            }
        },
        { threshold: 0.25 }
    );
    observer.observe(wrapperRef.value);
});

onBeforeUnmount(() => {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    if (videoRef.value) {
        videoRef.value.pause();
    }
});
</script>

<style scoped>
.story-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    transition-property: transform, box-shadow, border-color, background; transition-duration: 0.4s; transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.05);
    overflow: hidden;
    position: relative;
}

.story-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 50px rgba(200, 80, 232, 0.15);
    border-color: rgba(200, 80, 232, 0.3);
    background: rgba(255, 255, 255, 0.05);
}

.media-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 9 / 16;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.3);
}

.story-media {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.media-skeleton {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    aspect-ratio: 9 / 16;
    border-radius: 20px 20px 0 0;
}

/* 视频角标 */
.video-icon {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}
.video-icon i {
    font-size: 0.75rem;
    color: #fff;
}

.story-info {
    padding: 1rem 1.2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.story-time {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
    flex: 1 1 auto;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.story-time i {
    font-size: 0.75rem;
    opacity: 0.7;
    flex-shrink: 0;
}

.story-type-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.8rem;
    border-radius: 20px;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-weight: 500;
    white-space: nowrap;
    flex-shrink: 0;
}

/* 移动端：保持同行，缩小字号与间距避免拥挤 */
@media (max-width: 480px) {
    .story-info {
        padding: 0.45rem 0.55rem;
        gap: 0.35rem;
        flex-wrap: nowrap;
    }
    .story-time {
        font-size: 0.7rem;
        gap: 0.25rem;
    }
    .story-time i { font-size: 0.62rem; }
    .story-type-badge {
        font-size: 0.62rem;
        padding: 0.12rem 0.5rem;
        gap: 0.18rem;
    }
}

.video-badge {
    background: rgba(200, 80, 232, 0.15);
    color: rgba(200, 80, 232, 0.9);
    border: 1px solid rgba(200, 80, 232, 0.3);
}

.photo-badge {
    background: rgba(0, 204, 223, 0.1);
    color: rgba(0, 204, 223, 0.9);
    border: 1px solid rgba(0, 204, 223, 0.3);
}

@keyframes skeletonPulse {
    0% { opacity: 0.4; }
    50% { opacity: 0.15; }
    100% { opacity: 0.4; }
}

.skeleton-pulse {
    animation: skeletonPulse 1.5s ease-in-out infinite;
    background: rgba(255, 255, 255, 0.08);
}
</style>
