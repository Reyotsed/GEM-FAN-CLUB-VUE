<template>
    <div class="song-page">
        <div class="song-player">
            <audio
                ref="audio"
                @timeupdate="updateProgress"
                @loadedmetadata="duration = formatTime(audio.duration)"
                @ended="isPlaying = false"
                @error="handleAudioError"
                @canplay="handleCanPlay"
            ></audio>
            <div class="song-container">
                <div class="record-player">
                    <div class="record-disc" :class="{ 'is-playing': isPlaying }">
                        <div class="disc-inner">
                            <img 
                                :src="shownSong.coverPath" 
                                :alt="shownSong.title" 
                                class="song-cover"
                            />
                        </div>
                        <div class="record-arm"></div>
                    </div>
                </div>
                <div class="song-info">
                    <div class="song-title">
                        <h1>{{ shownSong.title }}</h1>
                    </div>
                    
                    <div class="song-meta">
                        <div class="meta-item">
                            <span class="label">专辑</span>
                            <span class="value">{{ shownSong.albumId }}</span>
                        </div>
                        <div class="meta-item">
                            <span class="label">歌手</span>
                            <span class="value">{{ shownSong.artist }}</span>
                        </div>
                    </div>

                    <div class="lyrics-section">
                        <div class="lyrics-title">歌词</div>
                        <div class="lyrics-content">
                            <p class="lyrics-line" 
                                v-for="(lyric, index) in displayedLyrics" 
                                :key="index" 
                                :class="{ 'highlight': index === 2 }" 
                                >
                                {{ lyric.text }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="player-controls">
                <div class="control-buttons">
                    <button class="control-btn prev" @click="playPrev">
                        <i class="prev-icon"></i>
                    </button>
                    <button class="control-btn play-pause" @click="togglePlay">
                        <i :class="isPlaying ? 'pause-icon' : 'play-icon'"></i>
                    </button>
                    <button class="control-btn next" @click="playNext">
                        <i class="next-icon"></i>
                    </button>
                </div>
                
                <div class="progress-container">
                    <span class="time current">{{ currentTime }}</span>
                    <div class="progress-bar" @click="setProgress">
                        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
                        <div class="progress-handle" :style="{ left: progress + '%' }"></div>
                    </div>
                    <span class="time total">{{ duration }}</span>
                </div>
                
                <div class="volume-control">
                    <i class="volume-icon"></i>
                    <div class="volume-slider" @click="setVolume">
                        <div class="volume-fill" :style="{ width: volume * 100 + '%' }"></div>
                        <div class="volume-handle" :style="{ left: volume * 100 + '%' }"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="song-list">
            <SongListModal />
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onBeforeMount, onMounted, onUnmounted, computed, watch } from 'vue'; 
import apiClient from '@/utils/api';
import { useSongStore } from '@/stores/song';
import SongListModal from '@/components/song/SongListModal.vue';

const songStore = useSongStore(); // 使用歌曲存储
const audio = ref(null);
const isPlaying = ref(false);
const currentTime = ref('00:00');
const duration = ref('00:00');
const progress = ref(0);
const volume = ref(0.7);
const parsedLyrics = ref([]);
const currentLyricIndex = ref(0);

// 将函数声明移到前面，确保在使用前已定义
// 解析歌词
const parseLyrics = (lyrics) => {
    if (!lyrics) return [];
    const lines = lyrics.split('\n');
    return lines.map(line => {
        const match = line.match(/\[(\d{2}):(\d{2}\.\d{2})\](.*)/);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseFloat(match[2]);
            const time = minutes * 60 + seconds;
            return { time, text: match[3].trim() };
        }
        return null;
    }).filter(Boolean);
};

// 格式化时间
const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// 二分查找函数
const findCurrentLyricIndex = (currentTime, lyrics) => {
    if (!lyrics || lyrics.length === 0) return 0;
    
    let left = 0;
    let right = lyrics.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (lyrics[mid].time === currentTime) {
            return mid; // 找到精确匹配
        } else if (lyrics[mid].time < currentTime) {
            left = mid + 1; // 向右查找
        } else {
            right = mid - 1; // 向左查找
        }
    }

    // 返回当前时间应该对应的歌词索引
    return right >= 0 ? right : 0; // right 是最后一个小于 currentTime 的索引
};

// 通过计算属性获取当前歌曲
const shownSong = computed(() => {
  const song = songStore.currentSong;
  if (!song) return {
    coverPath: '',
    title: '加载中...',
    albumId: '加载中...',
    artist: '加载中...',
    audioPath: '',
    lyrics: ''
  };
  
  return {
    id: song.songId, // 使用正确的字段名
    title: song.title || '未知歌曲',
    albumId: song.albumId || '未知专辑',
    artist: song.artist || '未知歌手',
    coverPath: song.coverUrl || '',
    audioPath: song.audioPath || '',
    lyrics: song.lyrics || ''
  };
});

const displayedLyrics = computed(() => {
    if (!parsedLyrics.value || parsedLyrics.value.length === 0) return [];
    
    const start = Math.max(0, currentLyricIndex.value - 2); // 从当前歌词索引向上取2条
    const end = Math.min(parsedLyrics.value.length, currentLyricIndex.value + 3); // 当前歌词索引向下取3条
    return parsedLyrics.value.slice(start, end); // 返回需要显示的歌词
});

// 简化监听函数，但确保在组件挂载时立即设置音频
watch(() => songStore.currentSong?.songId, (newSongId, oldSongId) => {
  if (!songStore.currentSong) return;
  
  // 设置音频源 - 始终设置，无论是否更新了 songId
  if (audio.value && songStore.currentSong.audioPath) {
    console.log('设置音频源:', songStore.currentSong.audioPath);
    audio.value.src = songStore.currentSong.audioPath;
    audio.value.load(); // 重要：加载音频
  }
  
  // 解析歌词
  if (songStore.currentSong.lyrics) {
    const lyrics = parseLyrics(songStore.currentSong.lyrics);
    
    // 添加空行，使用简单赋值而非多次修改
    parsedLyrics.value = [
      { time: -1, text: '1' },
      { time: -1, text: '2' },
      { time: -1, text: '3' },
      ...lyrics,
      { time: 10000, text: '4' },
      { time: 10000, text: '5' }
    ];
  } else {
    parsedLyrics.value = [];
  }
}, { immediate: true });

// 添加对音频加载的处理
onMounted(() => {
  // 设置初始音量
  if (audio.value) {
    audio.value.volume = volume.value;
    
    // 如果已有缓存的歌曲，立即设置
    if (songStore.currentSong && songStore.currentSong.audioPath) {
      console.log('mounted: 设置音频源:', songStore.currentSong.audioPath);
      audio.value.src = songStore.currentSong.audioPath;
      audio.value.load();
    }
  }

  // 确保页面滚动到顶部
  window.scrollTo(0, 0);
});

// 修改播放/暂停函数以包含更多错误处理
const togglePlay = () => {
  if (!audio.value) {
    console.error('音频元素未初始化');
    return;
  }
  
  if (!audio.value.src) {
    console.error('音频源未设置');
    
    // 尝试重新设置源
    if (songStore.currentSong && songStore.currentSong.audioPath) {
      console.log('重新设置音频源:', songStore.currentSong.audioPath);
      audio.value.src = songStore.currentSong.audioPath;
      audio.value.load();
    } else {
      return; // 没有源无法播放
    }
  }
    
  try {
    if (audio.value.paused) {
      const playPromise = audio.value.play();
      
      // 处理播放承诺，以捕获可能的错误
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isPlaying.value = true;
            console.log('开始播放');
          })
          .catch(error => {
            console.error('播放失败:', error);
            isPlaying.value = false;
          });
      }
    } else {
      audio.value.pause();
      isPlaying.value = false;
      console.log('暂停播放');
    }
  } catch (error) {
    console.error('togglePlay 错误:', error);
    isPlaying.value = false;
  }
};

// 更新进度
const updateProgress = () => {
    if (!audio.value) return;
    const value = (audio.value.currentTime / audio.value.duration) * 100;
    progress.value = value;
    currentTime.value = formatTime(audio.value.currentTime);
    // 更新歌词
    const currentTimeInSeconds = audio.value.currentTime;
    currentLyricIndex.value = findCurrentLyricIndex(currentTimeInSeconds, parsedLyrics.value);
};

// 设置进度
const setProgress = (event) => {
    if (!audio.value) return;
    
    const progressBar = event.currentTarget;
    const clickPosition = event.offsetX;
    const percentage = (clickPosition / progressBar.offsetWidth) * 100;
    progress.value = percentage;
    audio.value.currentTime = (percentage / 100) * audio.value.duration;
};

// 设置音量
const setVolume = (event) => {
    if (!audio.value) return;
    
    const volumeBar = event.currentTarget;
    const clickPosition = event.offsetX;
    const newVolume = clickPosition / volumeBar.offsetWidth;
    volume.value = Math.max(0, Math.min(1, newVolume));
    audio.value.volume = volume.value;
};

// 上一首/下一首（如果需要）
const playPrev = () => {
    // 实现上一首逻辑
};

const playNext = () => {
    // 实现下一首逻辑
};

// 加载歌曲 - 只在组件第一次挂载时调用一次
const loadSong = async () => {
  try {
    await songStore.fetchSong();
  } catch (error) {
    console.error('加载歌曲失败:', error);
  }
};

// 组件挂载前加载歌曲
onBeforeMount(() => {
  loadSong();
});

// 在组件卸载时清理资源
onUnmounted(() => {
  if (audio.value) {
    audio.value.pause();
    audio.value.src = '';
  }
});

// 添加音频错误处理
const handleAudioError = (event) => {
  console.error('音频加载错误:', event);
  isPlaying.value = false;
  
  // 尝试重新加载
  if (songStore.currentSong && songStore.currentSong.audioPath) {
    console.log('尝试重新加载音频');
    audio.value.src = songStore.currentSong.audioPath;
    audio.value.load();
  }
};

// 添加可以播放的处理
const handleCanPlay = () => {
  console.log('音频已准备好，可以播放');
};
</script>

<style scoped>
.song-page {
    min-height: 100vh;
    width: 100%;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    color: white;
    margin: 0;
    padding: 2rem 1rem;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow-x: hidden;
    position: absolute; /* 使用绝对定位填满整个视口 */
    top: 50px; /* 导航栏高度 */
    left: 0;
    right: 0;
}

.song-player {
    display: flex;
    flex-direction: column;
    width: 90%;
    /* max-width: 1400px; */
    margin: 0 auto;
    background: rgba(15, 15, 30, 0.3);
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    flex: 0 0 auto; /* 不要伸缩 */
}

.song-container {
    width: 100%;
    padding: 3rem 2rem 2rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    box-sizing: border-box;
}

.record-player {
    width: 48%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: auto;
}

.record-disc {
    width: 90%;
    position: relative;
    aspect-ratio: 1 / 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

.disc-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: transparent; /* 背景改为透明 */
    position: relative;
    overflow: hidden;
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.7);
    border: 8px solid rgba(30, 30, 30, 0.9);
    animation: rotate 20s linear infinite;
    animation-play-state: paused;
    transition: all 0.5s ease;
}

/* 移除中央黑色部分 */
.disc-inner::before {
    display: none;
}

/* 修改唱片环形效果，不遮挡中央 */
.disc-inner::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 15px solid rgba(20, 20, 20, 0.6);
    border-radius: 50%;
    box-sizing: border-box;
    pointer-events: none;
}

/* 添加旋转动画 */
@keyframes rotate {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

/* 播放状态下的动画 */
.is-playing .disc-inner {
    animation-play-state: running;
}

.song-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    position: relative;
    z-index: 0;
}

.record-arm {
    position: absolute;
    top: 10%;
    right: 15%;
    width: 150px;
    height: 5px;
    background: linear-gradient(90deg, rgba(40,40,40,1) 0%, rgba(80,80,80,1) 100%);
    transform-origin: right;
    transform: rotate(-20deg);
    transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    z-index: 10;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

.record-arm::before {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    background: rgba(80, 80, 80, 1);
    border-radius: 50%;
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
}

.record-arm::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(100, 100, 100, 1);
    transform: translate(-50%, -50%);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
}

/* 播放状态下唱臂的效果 */
.is-playing .record-arm {
    transform: rotate(-10deg);
}

/* 悬停效果 */
.disc-inner:hover {
    box-shadow: 0 0 60px rgba(255, 255, 255, 0.1);
}

.song-info {
    width: 48%;
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
}

.song-title {
    display: flex;
    align-items: center;
    margin-bottom: 2rem;
    justify-content: flex-start;
    position: relative;
}

.song-title h1 {
    font-size: 2.8rem;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(45deg, #ff69b4, #eb07ee);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    letter-spacing: 2px;
    position: relative;
    display: inline-block;
}

.song-title h1::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, #ff69b4, transparent);
}

.song-meta {
    margin-bottom: 2rem;
    border-left: 4px solid rgba(255,105,180,0.5);
    padding-left: 2rem;
    position: relative;
}

.meta-item {
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    transition: transform 0.3s ease;
}

.meta-item:hover {
    transform: translateX(10px);
}

.label {
    color: rgba(255, 255, 255, 0.7);
    margin-right: 2rem;
    font-size: 1.2rem;
    min-width: 60px;
    position: relative;
}

.label::after {
    content: ':';
    position: absolute;
    right: -10px;
}

.value {
    color: #fff;
    font-size: 1.3rem;
    font-weight: 500;
}

.lyrics-section {
    margin-top: 1rem;
    background: rgba(0,0,0,0.2);
    border-radius: 20px;
    padding: 2rem;
    backdrop-filter: blur(10px);
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.05);
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    height: calc(100% - 220px);
}

.lyrics-title {
    font-size: 1.6rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: #fff;
    position: relative;
    display: inline-block;
}

.lyrics-title::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, rgba(255,105,180,0.8), transparent);
}

.lyrics-content {
    padding-left: 1rem;
    padding-right: 1rem;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.2) transparent;
    position: relative;
}

.lyrics-content::-webkit-scrollbar {
    width: 4px;
}

.lyrics-content::-webkit-scrollbar-thumb {
    background-color: rgba(255,255,255,0.2);
    border-radius: 4px;
}

.lyrics-line {
    margin: 0.8rem 0;
    font-size: 1.3rem;
    line-height: 1.5;
    transition: all 0.3s ease;
    cursor: default;
    position: relative;
    padding-left: 10px;
}

.lyrics-line::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 2px;
    background: rgba(255,105,180,0.8);
    transition: width 0.3s ease;
}

.lyrics-line:hover {
    transform: translateX(15px);
    color: #fff;
}

.lyrics-line:hover::before {
    width: 5px;
}

.lyrics-line.highlight {
    color: #FF3366;
    font-weight: 600;
    font-size: 1.5rem;
    transform: translateX(10px);
}

.lyrics-line.highlight::before {
    width: 5px;
}

/* 播放控制栏样式 */
.player-controls {
    width: 100%;
    background: rgba(15, 15, 30, 0.9);
    backdrop-filter: blur(15px);
    padding: 1.2rem 2rem;
    display: flex;
    align-items: center;
    gap: 3rem;
    z-index: 10;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    box-sizing: border-box;
    box-shadow: 0 -5px 20px rgba(0,0,0,0.2);
    margin-top: auto; /* 将控制栏推到容器底部 */
}

.control-buttons {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    min-width: 180px;
}

.control-btn {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.play-pause {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #ff69b4, #eb07ee);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(235, 7, 238, 0.3);
    z-index: 2;
}

.play-pause:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 15px rgba(235, 7, 238, 0.4);
}

.prev-icon, .next-icon, .pause-icon, .volume-icon {
    display: inline-block;
    width: 20px;
    height: 20px;
    position: relative;
    z-index: 2;
}

.prev-icon::before {
    content: '';
    position: absolute;
    border-style: solid;
    border-width: 10px 15px 10px 0;
    border-color: transparent white transparent transparent;
    left: 0;
}

.next-icon::before {
    content: '';
    position: absolute;
    border-style: solid;
    border-width: 10px 0 10px 15px;
    border-color: transparent transparent transparent white;
    right: 0;
}

.pause-icon::before, .pause-icon::after {
    content: '';
    position: absolute;
    width: 4px;
    height: 16px;
    background: white;
    top: 50%;
    transform: translateY(-50%);
}

.pause-icon::before {
    right: 8px;
}

.pause-icon::after {
    left: 8px;
}

.play-icon::before {
    content: '';
    position: absolute;
    border-style: solid;
    border-width: 10px 0 10px 15px;
    border-color: transparent transparent transparent white;
    left: 19px;
    top: 50%;
    transform: translateY(-50%);
}

.volume-icon::before {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    border: 5px solid white;
    border-radius: 0 10px 10px 0;
    border-left: none;
    left: 0;
}

.progress-container {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 0;
}

.time {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.7);
    min-width: 45px;
}

.progress-bar {
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    position: relative;
    cursor: pointer;
    overflow: hidden;
}

.progress-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: linear-gradient(90deg, #ff69b4, #eb07ee);
    border-radius: 3px;
}

.progress-handle {
    position: absolute;
    width: 14px;
    height: 14px;
    background: white;
    border-radius: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 8px rgba(235, 7, 238, 0.7);
    z-index: 2;
}

.volume-control {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 120px;
}

.volume-slider {
    width: 80px;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    position: relative;
    cursor: pointer;
}

.volume-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 2px;
}

.volume-handle {
    position: absolute;
    width: 12px;
    height: 12px;
    background: white;
    border-radius: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}

/* 添加响应式布局 */
@media (max-width: 1200px) {
    .song-container, .player-controls {
        padding: 2rem 4% 2rem 4%;
    }
    
    .song-title h1 {
        font-size: 2.4rem;
    }
}

@media (max-width: 900px) {
    .song-container {
        flex-direction: column;
        height: auto;
        align-items: center;
    }
    
    .record-player, .song-info {
        width: 100%;
        max-width: 500px;
        margin: 0 auto;
    }
    
    .record-player {
        margin-bottom: 2rem;
    }
    
    .lyrics-section {
        height: 350px;
    }
}

@media (max-width: 600px) {
    .song-page {
        padding: 1rem 0.5rem;
    }
    
    .song-title h1 {
        font-size: 2rem;
    }
    
    .player-controls {
        padding: 0.8rem 2%;
        gap: 1rem;
    }
    
    .control-buttons {
        min-width: 150px;
    }
    
    .volume-control {
        min-width: 100px;
    }
    
    .volume-slider {
        width: 60px;
    }
    
    .record-disc {
        max-width: 350px;
    }
}

@media (max-width: 480px) {
    .song-container {
        padding: 1.5rem 1rem 1rem 1rem;
    }
    
    .record-disc {
        max-width: 280px;
    }
    
    .song-title h1 {
        font-size: 1.8rem;
    }
    
    .lyrics-line {
        font-size: 1.1rem;
    }
    
    .lyrics-line.highlight {
        font-size: 1.3rem;
    }
}

.song-list {
    width: 90%;
    margin: 2rem auto;
    position: relative;
    z-index: 1;
}
</style>