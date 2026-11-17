<template>
  <div class="quiz-game">
    <h2 class="section-title">
      <span class="icon">❓</span>
      知识问答
    </h2>
    <div class="coming-soon">
      <div class="coming-soon-icon">🚧</div>
      <h3>功能开发中...</h3>
      <p>知识问答游戏正在紧锣密鼓地开发中，敬请期待！</p>
      <p class="sub-text">如果你想帮助我们出题，欢迎通过首页联系方式联系我们！</p>
      <button class="back-btn" @click="goBack">返回游戏列表</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.push('/games')
}
</script>

<style scoped>
.quiz-game {
  min-height: 100vh;
  width: 100%;
  background: transparent;
  padding: var(--page-padding-y) var(--page-padding-x) var(--page-padding-bottom);
  box-sizing: border-box;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.section-title {
  text-align: center;
  margin-bottom: var(--space-12);
  font-size: clamp(var(--text-3xl), 5vw, var(--text-4xl));
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  background: var(--color-title-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.icon {
  font-size: 2.5rem;
  filter: drop-shadow(0 0 10px rgba(200, 80, 232, 0.5));
}

.coming-soon {
  text-align: center;
  padding: var(--space-16) var(--space-8);
  background: var(--surface-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--card-radius);
  border: 1px solid var(--surface-border);
  box-shadow: var(--shadow-md);
  max-width: 600px;
  width: 100%;
}

.coming-soon-icon {
  font-size: 5rem;
  margin-bottom: 2rem;
  filter: drop-shadow(0 0 20px rgba(200, 80, 232, 0.3));
}

.coming-soon h3 {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #fff, #f3caff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.coming-soon p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 0.5rem;
}

.sub-text {
  font-size: 0.95rem !important;
  color: rgba(255, 255, 255, 0.5) !important;
  margin-top: 1rem;
}

.back-btn {
  margin-top: var(--space-10);
  min-height: var(--button-height);
  padding: 0 var(--space-10);
  font-size: var(--text-lg);
  background: var(--color-brand-gradient);
  color: white;
  border: none;
  border-radius: var(--radius-pill);
  cursor: pointer;
  font-weight: 700;
  letter-spacing: 1px;
  box-shadow: var(--shadow-primary);
  transition-property: transform, box-shadow, opacity;
  transition-duration: 0.25s;
  transition-timing-function: var(--ease-out);
}

.back-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 40px rgba(200, 80, 232, 0.5);
  filter: brightness(1.1);
}

@media (max-width: 768px) {
  .quiz-game {
    padding: var(--page-padding-y) var(--page-padding-x) var(--page-padding-bottom);
  }

  .section-title {
    font-size: var(--text-3xl);
  }

  .coming-soon {
    padding: var(--space-12) var(--space-6);
  }

  .coming-soon h3 {
    font-size: 1.5rem;
  }
}
</style>