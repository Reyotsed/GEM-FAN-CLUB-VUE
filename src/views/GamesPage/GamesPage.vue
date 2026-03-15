<template>
  <div class="games-page">
    <h2 class="section-title">
      <span class="icon">🎮</span>
      邓紫棋粉丝小游戏
    </h2>
    <div class="games-grid">
      <div class="game-card highlight" @click="navigateTo('lyrics-chain')">
        <div class="game-icon">📝</div>
        <h3>歌词接龙</h3>
        <p>看看你能接出多少句歌词</p>
      </div>
      <div class="game-card highlight" @click="navigateTo('guess-song')">
        <div class="game-icon">🎵</div>
        <h3>听歌猜歌名 </h3>
        <p>测试你对邓紫棋歌曲的熟悉程度，快来挑战吧！</p>
      </div>
      <div class="game-card highlight" @click="navigateTo('ticket-rush')">
        <div class="game-icon">🎫</div>
        <h3>抢票模拟器</h3>
        <p>体验真实抢票的高并发场景，感受激烈竞争！</p>
      </div>
      <div class="game-card disabled" @click="navigateTo('quiz')">
        <div class="game-icon">❓</div>
        <h3>知识问答 <span class="game-status">（未开发）</span></h3>
        <p>挑战你对邓紫棋的了解</p>
      </div>
    </div>
    <p class="dev-tip">歌词接龙、听歌猜歌名和抢票模拟器已开放体验，后续更多游戏开发中，敬请期待！</p>
    <p class="dev-tip">由于需要收集大量解解的有关题目，如果有愿意提供帮助的朋友，可以通过首页最下方的联系方式联系我！</p>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const navigateTo = (gameType) => {
  router.push(`/games/${gameType}`)
}
</script>

<style scoped>
.games-page {
  min-height: 100vh;
  width: 100%;
  background: var(--bg-dark);
  background-image: 
      radial-gradient(circle at 20% 20%, rgba(235, 7, 238, 0.1), transparent 40%),
      radial-gradient(circle at 80% 80%, rgba(0, 242, 255, 0.1), transparent 40%);
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
  text-shadow: 0 0 30px rgba(235, 7, 238, 0.3);
}

.icon {
  font-size: 2.5rem;
  filter: drop-shadow(0 0 10px rgba(235, 7, 238, 0.5));
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  width: 100%;
  max-width: 1200px;
  margin-bottom: 3rem;
}

.game-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  overflow: hidden;
}

.game-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(235, 7, 238, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.game-card:hover {
  transform: translateY(-10px);
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(235, 7, 238, 0.3);
  box-shadow: 0 20px 50px rgba(235, 7, 238, 0.15);
}

.game-card:hover::before {
  opacity: 1;
}

.game-card.highlight {
  border-color: rgba(235, 7, 238, 0.2);
  box-shadow: 0 10px 30px rgba(235, 7, 238, 0.1);
}

.game-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.8);
}

.game-card.disabled:hover {
  transform: none;
  box-shadow: none;
  border-color: rgba(255, 255, 255, 0.05);
}

.game-icon {
  font-size: 4rem;
  margin-bottom: 0.5rem;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 0 20px rgba(235, 7, 238, 0.3));
}

.game-card:hover .game-icon {
  transform: scale(1.2) rotate(5deg);
}

.game-card h3 {
  color: #fff;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.game-card p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1rem;
  margin: 0;
  line-height: 1.6;
}

.game-status {
  font-size: 0.9rem;
  color: #eb07ee;
  background: rgba(235, 7, 238, 0.1);
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  border: 1px solid rgba(235, 7, 238, 0.2);
  white-space: nowrap;
}

.dev-tip {
  max-width: 800px;
  margin: 1rem auto;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 1.5rem;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .games-page {
    padding: calc(var(--nav-height, 70px) + 1rem) 1rem 1rem;
  }

  .section-title {
    font-size: 2rem;
    margin-bottom: 2rem;
  }

  .games-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .game-card {
    padding: 2rem 1.5rem;
  }

  .game-icon {
    font-size: 3.5rem;
  }

  .game-card h3 {
    font-size: 1.5rem;
  }
}
</style>