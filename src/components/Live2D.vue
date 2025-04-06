<template>
  <div class="live2d-container" :class="{ 'collapsed': isCollapsed }">
    <div class="toggle-button" @click="toggleCollapse">
      <i :class="isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
    </div>
    <div class="live2d-character" @click="showLyric">
      <div class="character-image" :class="{ 'active': isActive }">
        <i class="fas fa-headphones-alt"></i>
      </div>
    </div>
     <div class="lyric-bubble" 
         v-if="showBubble" 
         :class="{ 'fade-out': isFadingOut }"
         @animationend="handleAnimationEnd">
      <div class="song-title">《{{ currentLyric.song }}》</div>
      <div class="lyric-text">{{ currentLyric.lyric }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const lyrics = ref([]);
const currentLyric = ref({ song: '', lyric: '' });
const showBubble = ref(false);
const isActive = ref(false);
const isFadingOut = ref(false);
const isCollapsed = ref(false);
let bubbleTimer = null; // 用于追踪气泡定时器
let lastLyricIndex = -1; // 记录上一次显示的歌词索引

// 获取歌词数据
onMounted(async () => {
  try {
    const response = await fetch('/data/lyrics.json');
    const data = await response.json();
    lyrics.value = data.lyrics;
  } catch (error) {
    console.error('加载歌词失败:', error);
  }
});

// 切换收起/展开状态
const toggleCollapse = (event) => {
  event.stopPropagation(); // 阻止事件冒泡
  isCollapsed.value = !isCollapsed.value;
  
  // 如果收起时有气泡显示，则隐藏气泡
  if (isCollapsed.value && showBubble.value) {
    if (bubbleTimer) {
      clearTimeout(bubbleTimer);
    }
    startFadeOut();
  }
};

// 显示随机歌词
const showLyric = () => {
  // 如果组件已收起，点击时只展开不显示歌词
  if (isCollapsed.value) {
    isCollapsed.value = false;
    return;
  }
  
  if (lyrics.value.length === 0) return;
  
  // 清除之前的定时器
  if (bubbleTimer) {
    clearTimeout(bubbleTimer);
  }
  
  // 如果正在淡出，则重置淡出状态
  if (isFadingOut.value) {
    isFadingOut.value = false;
  }
  
  // 随机选择一条歌词，避免连续相同
  let randomIndex;
  const lyricsLength = lyrics.value.length;
  
  if (lyricsLength === 1) {
    // 只有一条歌词时，没有选择
    randomIndex = 0;
  } else {
    // 有多条歌词时，确保不重复
    do {
      randomIndex = Math.floor(Math.random() * lyricsLength);
    } while (randomIndex === lastLyricIndex && lyricsLength > 1);
    
    // 更新上一次的索引
    lastLyricIndex = randomIndex;
  }
  
  currentLyric.value = lyrics.value[randomIndex];
  
  // 显示气泡和动画效果
  showBubble.value = true;
  isActive.value = true;
  
  // 重置动画状态
  setTimeout(() => {
    isActive.value = false;
  }, 250);
  
  // 设置5秒后自动关闭气泡的定时器
  startBubbleTimer();
};

// 设置气泡自动关闭定时器
const startBubbleTimer = () => {
  // 清除之前的定时器
  if (bubbleTimer) {
    clearTimeout(bubbleTimer);
  }
  
  // 设置新的定时器，5秒后开始关闭气泡
  bubbleTimer = setTimeout(() => {
    startFadeOut();
    bubbleTimer = null;
  }, 5000);
};

// 开始淡出动画
const startFadeOut = () => {
  isFadingOut.value = true;
};

// 处理动画结束事件
const handleAnimationEnd = (event) => {
  // 仅处理淡出动画结束
  if (isFadingOut.value && event.animationName === 'fadeOut') {
    showBubble.value = false;
    isFadingOut.value = false;
  }
};
</script>

<style scoped>
.live2d-container {
  position: fixed;
  left: 30px;
  bottom: 30px;
  z-index: 9999;
  transition: transform 0.3s ease;
}

.live2d-container.collapsed {
  transform: translateX(-110px);
}

.toggle-button {
  position: absolute;
  right: -35px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #4a90e2, #8e54e9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 14px;
  opacity: 0.6;
  transition: opacity 0.3s ease;
  z-index: 10001;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.toggle-button:hover {
  opacity: 1;
}

.live2d-character {
  position: relative;
  cursor: pointer;
}

.character-image {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #4a90e2, #8e54e9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  color: white;
  font-size: 38px;
}

.character-image:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}

.character-image.active {
  animation: pulse 0.5s ease;
}

.lyric-bubble {
  position: absolute;
  bottom: 120px;
  left: 0;
  width: 280px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.3s ease;
  z-index: 10000;
  color: #333;
  border-left: 5px solid #4a90e2;
}

.lyric-bubble.fade-out {
  animation: fadeOut 0.5s ease forwards;
}

.lyric-bubble::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 30px;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid rgba(255, 255, 255, 0.95);
}

.song-title {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 16px;
  color: #4a90e2;
}

.lyric-text {
  font-size: 18px;
  line-height: 1.5;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-10px); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .character-image {
    width: 80px;
    height: 80px;
    font-size: 32px;
  }
  
  .lyric-bubble {
    width: 240px;
    bottom: 100px;
    padding: 15px;
  }
  
  .live2d-container.collapsed {
    transform: translateX(-90px);
  }
}
</style> 