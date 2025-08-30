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
        <h3>听歌猜歌名 <span class="game-status">（测试中）</span></h3>
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
  padding: 2rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(235, 7, 238, 0.15);
  margin-bottom: 3rem;
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
  position: relative;
  padding-bottom: 1rem;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 3px;
  background: linear-gradient(to right, #df0dee, #a505de);
  border-radius: 3px;
}

.icon {
  font-size: 1.8rem;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  padding: 1rem;
}

.game-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(223, 13, 238, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  border: 2px solid transparent;
}

.game-card.highlight {
  border: 2px solid #df0dee;
  box-shadow: 0 6px 24px rgba(223, 13, 238, 0.15);
  background: linear-gradient(135deg, #fff0fa 0%, #f3e6ff 100%);
}

.game-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.game-icon {
  font-size: 3.5rem;
  margin-bottom: 0.5rem;
  transition: transform 0.3s ease;
}

.game-card:hover .game-icon {
  transform: scale(1.1);
}

.game-card h3 {
  color: #333;
  font-size: 1.5rem;
  margin: 0;
}

.game-card p {
  color: #666;
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
}

.game-status {
  font-size: 1rem;
  color: #a505de;
  font-weight: 500;
  margin-left: 0.2em;
}

.dev-tip {
  margin-top: 2rem;
  color: #a505de;
  font-size: 1.1rem;
  text-align: center;
  background: linear-gradient(90deg, #fff0fa 0%, #f3e6ff 100%);
  border-radius: 10px;
  padding: 1rem 0.5rem;
  box-shadow: 0 2px 8px rgba(223, 13, 238, 0.07);
}

@media (max-width: 1024px) {
  .games-page {
    padding: 1.5rem;
  }

  .games-grid {
    gap: 1.5rem;
  }

  .game-card {
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .games-page {
    padding: 1rem;
    margin-bottom: 2rem;
  }

  .section-title {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
  }

  .games-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
  }

  .game-card {
    padding: 1.2rem;
  }

  .game-icon {
    font-size: 3rem;
  }

  .game-card h3 {
    font-size: 1.3rem;
  }
}

@media (max-width: 480px) {
  .games-page {
    padding: 0.8rem;
    margin-bottom: 1.5rem;
  }

  .section-title {
    font-size: 1.6rem;
    margin-bottom: 1.2rem;
  }

  .games-grid {
    grid-template-columns: 1fr;
    padding: 0.5rem;
  }

  .game-card {
    padding: 1rem;
  }

  .game-icon {
    font-size: 2.8rem;
  }

  .game-card h3 {
    font-size: 1.2rem;
  }

  .game-card p {
    font-size: 0.9rem;
  }
}
</style> 