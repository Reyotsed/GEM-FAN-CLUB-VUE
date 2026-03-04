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
    parsedLyrics.value = lyrics;
  } else {
    parsedLyrics.value = [{ time: 0, text: '暂无歌词' }];
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
    background: radial-gradient(circle at 50% 0%, #2a1a3a 0%, #0a0a12 100%);
    color: white;
    margin: 0;
    padding: calc(var(--nav-height, 70px) + 2rem) 2rem 2rem;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow-x: hidden;
    position: relative;
}

.song-player {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    position: relative;
}

/* 添加背景光晕 */
.song-player::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 50% 50%, rgba(235, 7, 238, 0.05), transparent 60%);
    pointer-events: none;
    z-index: 0;
}

.song-container {
    width: 100%;
    padding: 3rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    box-sizing: border-box;
    position: relative;
    z-index: 1;
    gap: 3rem;
}

.record-player {
    width: 45%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
}

.record-disc {
    width: 100%;
    max-width: 400px;
    aspect-ratio: 1 / 1;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.6));
}

.disc-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #111;
    position: relative;
    overflow: hidden;
    border: 4px solid #222;
    animation: rotate 20s linear infinite;
    animation-play-state: paused;
}

/* 唱片纹理 */
.disc-inner::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
        repeating-radial-gradient(
            #111 0, 
            #111 2px, 
            #222 3px, 
            #222 4px
        );
    border-radius: 50%;
    opacity: 0.6;
}

/* 唱片光泽 */
.disc-inner::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%);
    border-radius: 50%;
    pointer-events: none;
}

@keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.is-playing .disc-inner {
    animation-play-state: running;
}

.song-cover {
    width: 65%;
    height: 65%;
    object-fit: cover;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
    border: 8px solid #111;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.1);
}

.record-arm {
    position: absolute;
    top: -20px;
    right: 20px;
    width: 120px;
    height: 180px;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200"><path d="M50,10 C50,10 60,50 40,100 C20,150 30,180 30,180" stroke="%23ddd" stroke-width="8" fill="none"/><circle cx="50" cy="10" r="15" fill="%23aaa"/><rect x="20" y="170" width="20" height="30" fill="%23333"/></svg>');
    background-repeat: no-repeat;
    background-size: contain;
    transform-origin: 50% 10px;
    transform: rotate(-30deg);
    transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 10;
    filter: drop-shadow(5px 5px 10px rgba(0,0,0,0.5));
}

.is-playing .record-arm {
    transform: rotate(0deg);
}

.song-info {
    width: 50%;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 500px;
}

.song-title {
    margin-bottom: 1.5rem;
}

.song-title h1 {
    font-size: 3rem;
    font-weight: 900;
    margin: 0;
    background: linear-gradient(to right, #fff, #f3caff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -1px;
    line-height: 1.1;
}

.song-meta {
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;
}

.meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.label {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
}

.value {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
}

.lyrics-section {
    flex: 1;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 20px;
    padding: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
}

/* 歌词遮罩 */
.lyrics-section::before,
.lyrics-section::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 60px;
    z-index: 2;
    pointer-events: none;
}

.lyrics-section::before {
    top: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.2), transparent);
}

.lyrics-section::after {
    bottom: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.2), transparent);
}

.lyrics-title {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 2px;
}

.lyrics-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 0;
    text-align: center;
    mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
    -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
}

.lyrics-content::-webkit-scrollbar {
    width: 0;
}

.lyrics-line {
    margin: 1.2rem 0;
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.4);
    transition: all 0.4s ease;
    cursor: pointer;
}

.lyrics-line:hover {
    color: rgba(255, 255, 255, 0.8);
}

.lyrics-line.highlight {
    color: #fff;
    font-size: 1.4rem;
    font-weight: 700;
    text-shadow: 0 0 20px rgba(235, 7, 238, 0.6);
    transform: scale(1.05);
}

/* 播放控制栏 */
.player-controls {
    width: 100%;
    padding: 1.5rem 3rem;
    background: rgba(0, 0, 0, 0.2);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    gap: 2rem;
    z-index: 10;
}

.control-buttons {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.control-btn {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.control-btn:hover {
    color: #fff;
    transform: scale(1.1);
}

.play-pause {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: #fff;
    box-shadow: 0 10px 20px rgba(235, 7, 238, 0.3);
}

.play-pause:hover {
    transform: scale(1.1);
    box-shadow: 0 15px 30px rgba(235, 7, 238, 0.5);
}

.play-pause i {
    font-size: 1.5rem;
}

/* 图标样式 */
.prev-icon::before { content: '⏮'; font-size: 1.5rem; }
.next-icon::before { content: '⏭'; font-size: 1.5rem; }
.play-icon::before { content: '▶'; font-size: 1.2rem; margin-left: 4px; }
.pause-icon::before { content: '⏸'; font-size: 1.2rem; }
.volume-icon::before { content: '🔊'; font-size: 1.2rem; }

.progress-container {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.time {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.5);
    font-variant-numeric: tabular-nums;
}

.progress-bar {
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    transition: height 0.2s ease;
}

.progress-bar:hover {
    height: 6px;
}

.progress-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: var(--primary);
    border-radius: 2px;
    box-shadow: 0 0 10px var(--primary-glow);
}

.progress-handle {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    background: #fff;
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    transition: transform 0.2s ease;
    box-shadow: 0 0 10px rgba(0,0,0,0.3);
}

.progress-bar:hover .progress-handle {
    transform: translate(-50%, -50%) scale(1);
}

.volume-control {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    width: 140px;
}

.volume-slider {
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    cursor: pointer;
    position: relative;
}

.volume-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 2px;
}

.song-list {
    width: 100%;
    max-width: 1200px;
    margin: 2rem auto;
}

/* 响应式 */
@media (max-width: 900px) {
    .song-container {
        flex-direction: column;
        align-items: center;
        padding: 2rem;
        gap: 2rem;
    }

    .record-player {
        width: 100%;
        max-width: 300px;
    }

    .song-info {
        width: 100%;
        min-height: 400px;
    }

    .song-title h1 {
        font-size: 2rem;
        text-align: center;
    }

    .song-meta {
        justify-content: center;
    }
}

@media (max-width: 600px) {
    .song-page {
        padding: calc(var(--nav-height, 70px) + 1rem) 1rem 1rem;
    }

    .player-controls {
        flex-direction: column;
        padding: 1.5rem;
        gap: 1.5rem;
    }

    .progress-container {
        width: 100%;
        order: -1;
    }

    .control-buttons {
        justify-content: center;
        width: 100%;
    }

    .volume-control {
        display: none; /* 移动端隐藏音量条 */
    }
}
</style>
