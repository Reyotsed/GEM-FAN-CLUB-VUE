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
  padding: 2rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(235, 7, 238, 0.15);
  margin-bottom: 3rem;
}

.waterfall-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  padding: 20px;
}

.waterfall-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background: #fff;
  aspect-ratio: 1; /* 保持1:1的宽高比 */
}

.waterfall-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.waterfall-item img {
  width: 100%;
  height: 100%;
  display: block;
  transition: transform 0.3s ease;
  object-fit: cover; /* 确保图片填充整个容器 */
}

.waterfall-item:hover img {
  transform: scale(1.05);
}

.section-title {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.icon {
  font-size: 1.8rem;
}

.load-more {
  text-align: center;
  margin-top: 2rem;
}

.load-more button {
  padding: 0.8rem 2rem;
  background: #eb07ee;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.load-more button:hover {
  background: #a505de;
  transform: translateY(-2px);
}

.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.preview-content {
  position: relative;
  width: 80vw;
  height: 80vh;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  z-index: 1;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent);
}

.close-btn, .save-btn {
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s ease;
}

.close-btn:hover, .save-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}

.preview-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
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
}

.preview-controls {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 1rem;
  z-index: 1;
}

.preview-controls button {
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: 1.2rem;
}

.preview-controls button:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: scale(1.1);
}

.preview-controls button:disabled {
  background: rgba(0, 0, 0, 0.3);
  cursor: not-allowed;
  transform: none;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .waterfall-container {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
  }
}

@media (max-width: 768px) {
  .waterfall-container {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
    padding: 10px;
  }
}

@media (max-width: 480px) {
  .waterfall-container {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
    padding: 8px;
  }
}
</style>