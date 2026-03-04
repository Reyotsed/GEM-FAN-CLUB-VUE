<template>
  <div class="picture-page">
    <h2 class="section-title">
      <span class="icon">🎨</span>
      粉丝二创作品
    </h2>
    
    <div class="waterfall-container">
      <div v-for="(image, index) in displayedImages" 
           :key="index" 
           class="waterfall-item"
           @click="openPreview(index)">
        <img 
          :src="image.url" 
          :alt="image.title"
          loading="lazy"
          @load="handleImageLoad"
          @error="handleImageError"
        >
      </div>
    </div>

    <!-- 加载更多按钮 -->
    <div class="load-more" v-if="hasMoreImages && !loading">
      <button @click="loadMoreImages">
        加载更多
      </button>
    </div>

    <!-- 图片预览模态框 -->
    <div v-if="showPreview" class="preview-modal" @click="closePreview">
      <div class="preview-content" @click.stop>
        <div class="preview-header">
          <button class="close-btn" @click="closePreview">×</button>
          <button class="save-btn" @click="saveImage">
            <i class="fas fa-download"></i> 保存图片
          </button>
        </div>
        <div class="preview-image">
          <img :src="currentImage.url" :alt="currentImage.title" @error="handleImageError">
        </div>
        <div class="preview-controls">
          <button @click="prevImage" :disabled="currentIndex === 0">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button @click="nextImage" :disabled="currentIndex === displayedImages.length - 1">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// 所有图片数据
const allImages = ref([]);
// 当前显示的图片
const displayedImages = ref([]);
// 每批加载的图片数量
const batchSize = 6;
// 当前加载的批次数
const currentBatch = ref(1);
// 是否还有更多图片
const hasMoreImages = ref(true);
// 加载状态
const loading = ref(false);

// 初始化图片数据
const initImages = () => {
  const imageCount = 13; // 当前图片数量
  const imageData = [];
  
  for (let i = 1; i <= imageCount; i++) {
    imageData.push({
      url: `/img/picturePage/(${i}).jpg`,
      title: `G.E.M. 粉丝创作 ${i}`,
      author: `粉丝${String.fromCharCode(64 + i)}`,
      description: `这是粉丝${String.fromCharCode(64 + i)}创作的G.E.M.主题作品`
    });
  }
  
  allImages.value = imageData;
  // 初始加载第一批图片
  loadInitialImages();
};

// 加载初始图片
const loadInitialImages = () => {
  displayedImages.value = allImages.value.slice(0, batchSize);
  hasMoreImages.value = allImages.value.length > batchSize;
};

// 加载更多图片
const loadMoreImages = () => {
  if (loading.value) return;
  
  loading.value = true;
  currentBatch.value++;
  
  const startIndex = (currentBatch.value - 1) * batchSize;
  const endIndex = currentBatch.value * batchSize;
  const newImages = allImages.value.slice(startIndex, endIndex);
  
  // 模拟加载延迟
  setTimeout(() => {
    displayedImages.value.push(...newImages);
    hasMoreImages.value = endIndex < allImages.value.length;
    loading.value = false;
  }, 500);
};

// 预览相关状态
const showPreview = ref(false);
const currentIndex = ref(0);
const currentImage = ref(null);

// 打开预览
const openPreview = (index) => {
  currentIndex.value = index;
  currentImage.value = displayedImages.value[index];
  showPreview.value = true;
  document.body.style.overflow = 'hidden';
};

// 保存图片
const saveImage = async () => {
  try {
    const response = await fetch(currentImage.value.url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GEM-fanart-${currentIndex.value + 1}.jpg`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('保存图片失败:', error);
  }
};

// 处理图片加载错误
const handleImageError = (event) => {
  console.error('图片加载失败:', event.target.src);
  // 使用一个简单的内置占位图片
  event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGMEYwRjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1zaXplPSIxNiI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pjwvc3ZnPg==';
  // 移除加载失败的图片的点击事件
  event.target.parentElement.style.cursor = 'not-allowed';
  event.target.parentElement.onclick = null;
};

// 处理图片加载
const handleImageLoad = (event) => {
  const img = event.target;
//   console.log('图片加载成功:', img.src);
};

// 关闭预览
const closePreview = () => {
  showPreview.value = false;
  document.body.style.overflow = '';
};

// 上一张图片
const prevImage = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    currentImage.value = displayedImages.value[currentIndex.value];
  }
};

// 下一张图片
const nextImage = () => {
  if (currentIndex.value < displayedImages.value.length - 1) {
    currentIndex.value++;
    currentImage.value = displayedImages.value[currentIndex.value];
  }
};

onMounted(() => {
  initImages();
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

// 处理键盘事件
const handleKeyDown = (e) => {
  if (!showPreview.value) return;
  
  if (e.key === 'Escape') {
    closePreview();
  } else if (e.key === 'ArrowLeft') {
    prevImage();
  } else if (e.key === 'ArrowRight') {
    nextImage();
  }
};
</script>

<style scoped>
.picture-page {
  width: 100%;
  min-height: 100vh;
  background: var(--bg-dark);
  background-image: 
      radial-gradient(circle at 20% 30%, rgba(235, 7, 238, 0.1), transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(0, 242, 255, 0.1), transparent 40%);
  margin: 0;
  padding: calc(var(--nav-height, 70px) + 2rem) 2rem 2rem;
  box-sizing: border-box;
  color: #fff;
}

.section-title {
  text-align: center;
  margin-bottom: 3rem;
  font-size: 2.5rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: linear-gradient(to right, #fff, #f3caff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(235, 7, 238, 0.3);
}

.icon {
  font-size: 2.5rem;
  filter: drop-shadow(0 0 10px rgba(235, 7, 238, 0.5));
}

.waterfall-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.waterfall-item {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  background: rgba(255, 255, 255, 0.05);
  aspect-ratio: 1;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.waterfall-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.8));
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
}

.waterfall-item:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 50px rgba(235, 7, 238, 0.2);
  border-color: rgba(235, 7, 238, 0.5);
}

.waterfall-item:hover::before {
  opacity: 1;
}

.waterfall-item img {
  width: 100%;
  height: 100%;
  display: block;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  object-fit: cover;
}

.waterfall-item:hover img {
  transform: scale(1.1);
}

/* 加载更多按钮 */
.load-more {
  text-align: center;
  margin-top: 4rem;
  margin-bottom: 2rem;
}

.load-more button {
  padding: 1rem 3rem;
  background: linear-gradient(135deg, #eb07ee, #a505de);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(235, 7, 238, 0.3);
  position: relative;
  overflow: hidden;
}

.load-more button::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.load-more button:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 40px rgba(235, 7, 238, 0.5);
}

.load-more button:hover::after {
  transform: translateX(100%);
}

/* 预览模态框 */
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.preview-content {
  position: relative;
  width: 90vw;
  height: 90vh;
  background: transparent;
  border-radius: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: none;
}

.preview-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 2rem;
  display: flex;
  justify-content: space-between;
  z-index: 10;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent);
  pointer-events: none; /* 让点击穿透 */
}

.preview-header button {
  pointer-events: auto; /* 恢复按钮点击 */
}

.close-btn, .save-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.6rem 1.2rem;
  border-radius: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.close-btn:hover, .save-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.preview-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  position: relative;
  overflow: hidden;
}

.preview-image img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  transition: transform 0.3s ease;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.5);
  border-radius: 8px;
}

.preview-controls {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 2rem;
  z-index: 10;
  pointer-events: none;
}

.preview-controls button {
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: 1.5rem;
  backdrop-filter: blur(10px);
}

.preview-controls button:hover {
  background: rgba(235, 7, 238, 0.2);
  border-color: rgba(235, 7, 238, 0.5);
  transform: scale(1.1);
  color: #fff;
}

.preview-controls button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
  background: rgba(255, 255, 255, 0.05);
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .waterfall-container {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .picture-page {
    padding: calc(var(--nav-height, 70px) + 1rem) 1rem 1rem;
  }

  .section-title {
    font-size: 1.8rem;
    margin-bottom: 2rem;
  }

  .waterfall-container {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1rem;
    padding: 0.5rem;
  }
  
  .preview-controls {
    padding: 0 1rem;
  }
  
  .preview-controls button {
    width: 44px;
    height: 44px;
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .waterfall-container {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.8rem;
  }
  
  .load-more button {
    padding: 0.8rem 2rem;
    font-size: 1rem;
  }
}
</style>