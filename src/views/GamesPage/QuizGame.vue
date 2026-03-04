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
  background: radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%);
  padding: calc(var(--nav-height, 70px) + 2rem) 2rem 2rem;
  box-sizing: border-box;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
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
}

.icon {
  font-size: 2.5rem;
  filter: drop-shadow(0 0 10px rgba(235, 7, 238, 0.5));
}

.coming-soon {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 100%;
}

.coming-soon-icon {
  font-size: 5rem;
  margin-bottom: 2rem;
  filter: drop-shadow(0 0 20px rgba(235, 7, 238, 0.3));
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
  margin-top: 2.5rem;
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  background: linear-gradient(135deg, var(--primary, #eb07ee), var(--primary-dark, #a505de));
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: 1px;
  box-shadow: 0 10px 30px rgba(235, 7, 238, 0.3);
  transition: all 0.3s ease;
}

.back-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 40px rgba(235, 7, 238, 0.5);
  filter: brightness(1.1);
}

@media (max-width: 768px) {
  .quiz-game {
    padding: calc(var(--nav-height, 70px) + 1rem) 1rem 1rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .coming-soon {
    padding: 3rem 1.5rem;
  }

  .coming-soon h3 {
    font-size: 1.5rem;
  }
}
</style>