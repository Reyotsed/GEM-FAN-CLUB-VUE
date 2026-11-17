<template>
  <div class="games-page">
    <header class="gp-hero">
      <div class="gp-hero-badge">🎮 FAN GAMES</div>
      <h2 class="gp-hero-title">邓紫棋粉丝小游戏</h2>
      <p class="gp-hero-sub">挑战歌词、辨识旋律、感受抢票热度</p>
    </header>

    <ul class="gp-list">
      <li
        v-for="g in games"
        :key="g.key"
        class="gp-item"
        :class="{ 'is-disabled': g.disabled }"
        @click="!g.disabled && navigateTo(g.key)"
      >
        <div class="gp-icon" :style="{ background: g.gradient }">
          <span>{{ g.icon }}</span>
        </div>
        <div class="gp-meta">
          <div class="gp-title-row">
            <h3 class="gp-title">{{ g.title }}</h3>
            <span v-if="g.tag" class="gp-tag" :class="g.tagClass">{{ g.tag }}</span>
          </div>
          <p class="gp-desc">{{ g.desc }}</p>
        </div>
        <div class="gp-arrow" v-if="!g.disabled">›</div>
      </li>
    </ul>

    <p class="gp-footer">
      由于需要收集大量解解的题目，欢迎通过首页底部联系方式联系我提供帮助 ✨
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getCachedStreak } from '@/utils/dailyGuess'

const router = useRouter()
const dailyStreak = getCachedStreak()

const baseGames = [
  {
    key: 'daily',
    icon: '🎧',
    title: '每日猜歌',
    desc: '每天一首，听前奏猜歌名，冲排行榜',
    tag: '每日更新',
    tagClass: 'tag-new',
    gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
    disabled: false,
  },
  {
    key: 'lyrics-chain',
    icon: '📝',
    title: '歌词接龙',
    desc: '看看你能接出多少句歌词',
    gradient: 'linear-gradient(135deg, #D946EF, #A21CAF)',
    disabled: false,
  },
  {
    key: 'guess-song',
    icon: '🎵',
    title: '听歌猜歌名',
    desc: '测试你对邓紫棋歌曲的熟悉程度',
    gradient: 'linear-gradient(135deg, #B980FF, #8A2BE2)',
    disabled: false,
  },
  {
    key: 'ticket-rush',
    icon: '🎫',
    title: '抢票模拟器',
    desc: '体验真实抢票的高并发场景',
    gradient: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
    disabled: false,
  },
  {
    key: 'hummingbird-strike',
    icon: '🐦',
    title: '痛击蜂鸟',
    desc: '20秒爽点蜂鸟，攒能量释放音浪炸弹',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    disabled: false,
  },
  {
    key: 'quiz',
    icon: '❓',
    title: '知识问答',
    desc: '挑战你对邓紫棋的了解程度',
    tag: '未开放',
    tagClass: 'tag-soon',
    gradient: 'linear-gradient(135deg, #555, #333)',
    disabled: true,
  },
]

// 每日猜歌卡片：有连胜时，标签换成连胜天数
const games = computed(() =>
  baseGames.map(g =>
    g.key === 'daily' && dailyStreak > 0
      ? { ...g, tag: `🔥 ${dailyStreak} 天连胜`, tagClass: 'tag-hot' }
      : g
  )
)

const navigateTo = (gameType) => {
  router.push(`/games/${gameType}`)
}
</script>

<style scoped>
/* ============================================================
 * Games Lobby - 重新整理为单一来源样式
 * ============================================================ */
.games-page {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: 100vh;
  width: 100%;
  padding: var(--page-padding-y) var(--page-padding-x) var(--page-padding-bottom);
  box-sizing: border-box;
  background: transparent;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 舞台光斑 */
.games-page::before,
.games-page::after {
  content: '';
  position: fixed;
  z-index: -1;
  pointer-events: none;
  border-radius: 999px;
  filter: blur(40px);
}
.games-page::before {
  width: 50vw;
  height: 50vw;
  top: 6vh;
  right: -16vw;
  background: radial-gradient(circle, rgba(255, 61, 219, 0.22), transparent 65%);
}
.games-page::after {
  width: 42vw;
  height: 42vw;
  left: -12vw;
  bottom: 6vh;
  background: radial-gradient(circle, rgba(185, 128, 255, 0.18), transparent 70%);
}

/* ---------- Hero ---------- */
.gp-hero {
  position: relative;
  width: 100%;
  max-width: 760px;
  text-align: center;
  margin-bottom: 18px;
  padding: clamp(20px, 5vw, 40px) clamp(18px, 4vw, 32px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.03)),
    radial-gradient(circle at 20% 18%, rgba(255, 61, 219, 0.22), transparent 36%),
    radial-gradient(circle at 80% 22%, rgba(185, 128, 255, 0.20), transparent 36%);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.gp-hero-badge {
  display: inline-block;
  padding: 5px 14px;
  font-size: 0.7rem;
  letter-spacing: 2px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  margin-bottom: 12px;
  box-shadow: 0 0 20px rgba(255, 61, 219, 0.18);
}

.gp-hero-title {
  margin: 0 0 8px;
  font-size: clamp(1.7rem, 6vw, 2.6rem);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.03em;
  background: var(--color-title-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 24px rgba(255, 61, 219, 0.18);
}

.gp-hero-sub {
  margin: 0;
  font-size: clamp(0.84rem, 2vw, 0.96rem);
  color: rgba(255, 255, 255, 0.72);
}

/* ---------- List (移动单列 → 桌面三列) ---------- */
.gp-list {
  list-style: none;
  width: 100%;
  max-width: 760px;
  padding: 0;
  margin: 0 0 16px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.gp-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 50px 14px 14px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.03)),
    rgba(18, 12, 32, 0.62);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.25s var(--ease-out), border-color 0.25s, background 0.25s, box-shadow 0.25s;
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.10);
}

/* 卡片角光斑 */
.gp-item::before {
  content: '';
  position: absolute;
  inset: -40% -30% auto auto;
  width: 150px;
  height: 150px;
  border-radius: 999px;
  background: var(--card-glow, rgba(255, 61, 219, 0.24));
  filter: blur(20px);
  opacity: 0.7;
  transition: transform 0.35s var(--ease-out), opacity 0.35s;
}

/* 各游戏的差异化色光 */
.gp-item:nth-child(1) { --card-glow: rgba(167, 139, 250, 0.34); }
.gp-item:nth-child(2) { --card-glow: rgba(255, 61, 219, 0.30); }
.gp-item:nth-child(3) { --card-glow: rgba(185, 128, 255, 0.30); }
.gp-item:nth-child(4) { --card-glow: rgba(255, 107, 107, 0.28); }
.gp-item:nth-child(5) { --card-glow: rgba(245, 158, 11, 0.30); }
.gp-item:nth-child(6) { --card-glow: rgba(120, 120, 120, 0.20); }

.gp-item:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.24);
  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.30), 0 0 24px var(--card-glow);
}
.gp-item:hover::before {
  transform: translate(-12px, 12px) scale(1.15);
  opacity: 1;
}

/* "敬请期待" 状态 */
.gp-item.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
  filter: saturate(0.4);
}
.gp-item.is-disabled:hover {
  transform: none;
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.22);
}
.gp-item.is-disabled:hover::before { transform: none; }

/* 图标方块 */
.gp-icon {
  position: relative;
  z-index: 1;
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 1.6rem;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.gp-meta {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
}

.gp-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.gp-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.01em;
}

.gp-tag {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}
.tag-soon {
  color: rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
}
.tag-new {
  color: #fff;
  background: linear-gradient(135deg, #a78bfa, #7c3aed);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.tag-hot {
  color: #c4b5fd;
  background: rgba(167, 139, 250, 0.16);
  border: 1px solid rgba(167, 139, 250, 0.4);
}

.gp-desc {
  margin: 0;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 箭头：右侧居中圆形 */
.gp-arrow {
  position: absolute;
  z-index: 1;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 1.2rem;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.14);
  transition: transform 0.25s, background 0.25s, color 0.25s;
}
.gp-item:hover .gp-arrow {
  transform: translateY(-50%) translateX(3px);
  background: var(--card-glow, rgba(255, 61, 219, 0.24));
  color: #fff;
}

/* ---------- Footer Tip ---------- */
.gp-footer {
  width: 100%;
  max-width: 760px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  padding: 10px 14px;
  line-height: 1.5;
  margin: 0;
  backdrop-filter: blur(12px);
}

/* ---------- Tablet & Desktop (≥ 768px) ---------- */
@media (min-width: 768px) {
  .gp-list {
    max-width: 980px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
  .gp-item {
    flex-direction: column;
    align-items: flex-start;
    min-height: 200px;
    padding: 22px;
    border-radius: 22px;
  }
  .gp-icon {
    flex-basis: 60px;
    width: 60px;
    height: 60px;
    border-radius: 18px;
    font-size: 1.9rem;
  }
  .gp-title-row { margin-top: 12px; }
  .gp-title { font-size: 1.15rem; }
  .gp-desc { font-size: 0.86rem; -webkit-line-clamp: 3; }
  .gp-arrow {
    top: auto;
    bottom: 18px;
    right: 18px;
    transform: none;
    width: 36px;
    height: 36px;
  }
  .gp-item:hover .gp-arrow {
    transform: translateX(4px);
  }
  .gp-hero { max-width: 980px; }
  .gp-footer { max-width: 980px; }
}

/* ---------- Reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .gp-item:hover { transform: none; }
  .gp-item:hover::before { transform: none; }
}


</style>