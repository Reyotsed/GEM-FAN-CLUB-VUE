
<template>
  <Teleport to="body">
    <div class="guide-modal" v-if="isVisible" @click.self="closeModal">
      <div class="modal-backdrop" @click="closeModal"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>💜 来自棋士的 IAG 演唱会攻略</h2>
          <button class="close-button" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <p class="guide-intro">科普一下解解"邓紫棋"演唱会一些互动流程，可以看出场《摩天动物园》出现"唯有忍耐到底的"<strong>大声接</strong>"必然得救！"</p>

          <!-- 1. 摩天动物园 -->
          <div class="guide-section">
            <h3><span class="section-icon">🎵</span> 1.《摩天动物园》</h3>
            <p class="guide-text">解解 💜 唱到"不怕黑也不怕脏"接大声喊<strong>"大便也舔上，为了要前往光鲜的监房"</strong></p>
          </div>

          <!-- 2. 递麦环节 -->
          <div class="guide-section">
            <h3><span class="section-icon">🎤</span> 2. 递麦环节</h3>
            <p class="guide-text">解解递麦的时候要<strong>大声唱</strong>，别管你是歌神还是五音不全，吼就完了，都是路人，不要社恐，没人知道你是谁！<span class="highlight-tag">周围粉丝跟唱谢谢理解</span></p>
          </div>

          <!-- 3. 换衣服环节 -->
          <div class="guide-section">
            <h3><span class="section-icon">👗</span> 3. 换衣服环节</h3>
            <p class="guide-text">解解换衣服的时候 <span class="highlight-tag">跟着嗓子喊</span> 喊"邓紫棋""邓紫棋"！<span class="highlight-tag">大声点！不用怕尴尬</span></p>
          </div>

          <!-- 4. 句号 -->
          <div class="guide-section">
            <h3><span class="section-icon">⏹️</span> 4.《句号》</h3>
            <p class="guide-text">唱到"你说是我的商品"的时候，要大喊<strong>"你不是！"</strong>"这个具有特殊意义！可恶的蜂鸟！</p>
          </div>

          <!-- 5. 夜的尽头 -->
          <div class="guide-section">
            <h3><span class="section-icon">🌙</span> 5.《夜的尽头》</h3>
            <p class="guide-text">开始是蹦迪歌曲，直接起来嗨就完事了！倒数+GEM+walk on water 也不要坐下，一直蹦就完了！这一 part 就是专门蹦迪的！不要理会不站的，他们可能有第一次来的不知道，因为是邓紫棋让我们站起来的~</p>
          </div>

          <!-- 6. G.E.M. -->
          <div class="guide-section">
            <h3><span class="section-icon">💜</span> 6.《G.E.M.》</h3>
            <p class="guide-text">俗称军训环节，手解解会大声喊 <strong>give me G</strong>，这时候大声喊 G，然后解解会喊 <strong>give me E</strong>，要大声喊 E，然后是 <strong>give me M</strong>，要大声喊 M。最后解解会喊 give me，要连起来喊 <strong>GEM</strong>，会重复两到三遍~</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';

const isVisible = ref(false);

const openModal = () => {
  isVisible.value = true;
  document.body.style.overflow = 'hidden';
};

const closeModal = () => {
  isVisible.value = false;
  document.body.style.overflow = '';
};

defineExpose({ openModal });
</script>

<style scoped>
.guide-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 640px;
  max-height: 85vh;
  background: rgba(25, 25, 45, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  z-index: 1101;
  animation: slideIn 0.3s ease;
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, rgba(200, 80, 232, 0.5), rgba(139, 47, 192, 0.5));
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.6rem;
  cursor: pointer;
  transition-property: transform, box-shadow, opacity;
  transition-duration: 0.2s;
  transition-timing-function: ease;
  line-height: 1;
}

.close-button:hover {
  transform: scale(1.1);
  color: #fff;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

/* 自定义滚动条 */
.modal-body::-webkit-scrollbar {
  width: 6px;
}
.modal-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}
.modal-body::-webkit-scrollbar-thumb {
  background: rgba(200, 80, 232, 0.3);
  border-radius: 3px;
}
.modal-body::-webkit-scrollbar-thumb:hover {
  background: rgba(200, 80, 232, 0.5);
}

.guide-section {
  margin-bottom: 1.5rem;
  padding: 1.2rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: border-color 0.3s ease;
}

.guide-section:last-child {
  margin-bottom: 0;
}

.guide-section:hover {
  border-color: rgba(200, 80, 232, 0.2);
}

.guide-intro {
  margin: 0 0 1.5rem 0;
  padding: 1rem;
  background: rgba(200, 80, 232, 0.08);
  border-radius: 10px;
  border-left: 3px solid #D946EF;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.92rem;
  line-height: 1.7;
}

.guide-section h3 {
  margin: 0 0 0.6rem 0;
  font-size: 1.05rem;
  color: #f3caff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-icon {
  font-size: 1.2rem;
}

.guide-text {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.92rem;
  line-height: 1.8;
}

.guide-text strong {
  color: #fff;
}

.highlight-tag {
  display: inline-block;
  background: rgba(200, 80, 232, 0.15);
  color: #f3caff;
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  border: 1px solid rgba(200, 80, 232, 0.25);
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }

  .modal-header h2 {
    font-size: 1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .guide-section {
    padding: 1rem;
  }
}
</style>
