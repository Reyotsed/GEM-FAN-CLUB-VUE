<template>
    <div class="story-card" @click="handleClick">
        <!-- 视频 -->
        <div class="media-wrapper" v-if="story.mediaType === 2">
            <video
                ref="videoRef"
                class="story-media"
                :src="mediaUrl"
                :poster="posterUrl"
                preload="metadata"
                loop
                playsinline
                webkit-playsinline
                @loadeddata="onMediaLoaded"
            />
            <div class="play-overlay" v-if="!isPlaying">
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
import { ref, computed, onBeforeUnmount } from 'vue';

const props = defineProps({
    story: { type: Object, required: true },
    baseUrl: { type: String, required: true }
});

const videoRef = ref(null);
const isPlaying = ref(false);
const mediaLoaded = ref(false);

const mediaUrl = computed(() => {
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
    // 后端返回的是 ISO 格式或者 "yyyy-MM-ddTHH:mm:ss" 格式
    const date = new Date(props.story.takenAt);
    if (isNaN(date.getTime())) return props.story.takenAt;
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;

    return date.toLocaleDateString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit'
    });
});

function onMediaLoaded() {
    mediaLoaded.value = true;
}

function handleClick() {
    if (props.story.mediaType === 2 && videoRef.value) {
        if (isPlaying.value) {
            videoRef.value.pause();
            isPlaying.value = false;
        } else {
            videoRef.value.play();
            isPlaying.value = true;
        }
    }
}

onBeforeUnmount(() => {
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
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.05);
    overflow: hidden;
    position: relative;
}

.story-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 50px rgba(235, 7, 238, 0.15);
    border-color: rgba(235, 7, 238, 0.3);
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

.play-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.2);
    transition: background 0.3s ease;
}

.play-overlay i {
    font-size: 3rem;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
    transition: transform 0.3s ease;
}

.story-card:hover .play-overlay {
    background: rgba(0, 0, 0, 0.3);
}

.story-card:hover .play-overlay i {
    transform: scale(1.2);
}

.story-info {
    padding: 1rem 1.2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.story-time {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.story-time i {
    font-size: 0.75rem;
    opacity: 0.7;
}

.story-type-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.8rem;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-weight: 500;
}

.video-badge {
    background: rgba(235, 7, 238, 0.15);
    color: rgba(235, 7, 238, 0.9);
    border: 1px solid rgba(235, 7, 238, 0.3);
}

.photo-badge {
    background: rgba(0, 242, 255, 0.1);
    color: rgba(0, 242, 255, 0.9);
    border: 1px solid rgba(0, 242, 255, 0.3);
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
</style>
