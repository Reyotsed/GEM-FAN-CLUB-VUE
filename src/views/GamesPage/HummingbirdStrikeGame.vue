<template>
  <div class="hummingbird-game gx-page gx-rose">
    <header class="gx-header">
      <button class="gx-back" @click="goBack" aria-label="返回">‹</button>
      <div class="gx-title-wrap">
        <span class="gx-icon">🐦</span>
        <h2 class="gx-title">痛击蜂鸟</h2>
      </div>
      <span class="gx-spacer" />
    </header>

    <p class="gx-subtitle" v-if="phase === 'idle'">
      20 秒，蜂鸟从喇叭里冒头时狠狠点它！攒满音浪槽释放 <b>G-Bomb</b> 全屏清场！
    </p>

    <!-- Idle / Settings -->
    <div class="gx-card" v-if="phase === 'idle'">
      <h3 class="gx-section-h">规则</h3>
      <ul class="rule-list">
        <li><span class="rule-icon normal-icon"><svg viewBox="0 0 100 100" class="hb-svg"><use href="#hb-def"/></svg></span> 普通蜂鸟 +10 分，冒头 1 秒</li>
        <li><span class="rule-icon diamond-icon"><svg viewBox="0 0 100 100" class="hb-svg"><use href="#hb-def"/></svg></span> 钻石蜂鸟 +50 分，冒头 0.7 秒，更难打</li>
        <li><span class="rule-icon boss-icon"><svg viewBox="0 0 100 100" class="hb-svg"><use href="#hb-def"/></svg></span> BOSS 蜂鸟 +200 分，要连点 3 下，冒头 1.4 秒</li>
        <li>连击 Combo 倍率最高 ×3.0，漏一只重置</li>
        <li>音浪槽满后点 G-Bomb 按钮全屏清场</li>
      </ul>

      <div class="gx-actions" style="margin-top: 20px; margin-bottom: 20px;">
        <button class="gx-btn gx-btn-primary gx-btn-block" @click="startGame">
          开始游戏
        </button>
      </div>

      <h3 class="gx-section-h">🏆 棋士排行榜 TOP 10</h3>
      <div v-if="loadingBoard" class="board-empty">加载中...</div>
      <div v-else-if="!leaderboard.length" class="board-empty">还没有人登榜，第一个就是你！</div>
      <ul v-else class="board-list" style="margin-bottom: 20px;">
        <li v-for="(row, i) in leaderboard" :key="row.id" class="board-row" :class="{ top1: i === 0, top2: i === 1, top3: i === 2 }">
          <span class="rank">{{ i + 1 }}</span>
          <span class="name">{{ row.nickname }}</span>
          <span class="score">{{ row.score }}</span>
        </li>
      </ul>

      <p class="legal-note">
        本游戏为虚构娱乐内容，蜂鸟为通用鸟类形象，与现实任何机构无关。
      </p>
    </div>

    <!-- Playing -->
    <template v-if="phase === 'playing'">
      <div class="gx-card hud-card">
        <div class="hud-row">
          <div class="hud-item">
            <span class="label">时间</span>
            <span class="value" :class="{ danger: remainingTime <= 5 }">{{ remainingTime }}s</span>
          </div>
          <div class="hud-item">
            <span class="label">分数</span>
            <span class="value">{{ score }}</span>
          </div>
          <div class="hud-item">
            <span class="label">Combo</span>
            <span class="value combo">×{{ comboMult.toFixed(1) }}</span>
          </div>
        </div>
        <div class="ult-bar-wrap" :class="{ clickable: ultReady }" @click="ultReady && triggerUltimate()">
          <div class="ult-bar" :style="{ width: ultPercent + '%' }"
               :class="{ ready: ultReady }"></div>
          <span class="ult-label">{{ ultReady ? '⚡ 点此释放 G-BOMB' : '音浪槽 ' + Math.floor(ultPercent) + '%' }}</span>
        </div>
      </div>

      <div class="grid-card" :class="{ 'shockwave-active': isShockwave, 'shake-active': isShaking }">
        <!-- SVG Defs for reuse -->
        <svg style="display: none;">
          <defs>
            <g id="hb-def" transform="translate(10, 15)">
              <path d="M 0 35 L 30 40" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
              <path d="M 25 40 C 25 20, 50 20, 60 35 C 70 50, 70 70, 50 75 C 35 80, 25 60, 25 40 Z" fill="currentColor"/>
              <path d="M 50 75 L 75 95 L 65 65 Z" fill="currentColor"/>
              <path d="M 45 35 C 30 10, 50 -10, 70 0 C 75 15, 60 30, 45 35 Z" fill="#ffffff" opacity="0.9" class="wing"/>
              <circle cx="38" cy="32" r="4" fill="#000"/>
            </g>
          </defs>
        </svg>

        <div class="grid-board" :style="gridStyle">
          <div
            v-for="(hole, idx) in holes"
            :key="idx"
            class="hole"
            @pointerdown="onHoleTap(idx, $event)"
          >
            <div class="hole-inner"></div>
            <div class="hole-mouth"></div>
            <div
              v-if="hole.bird"
              class="bird"
              :class="['bird-' + hole.bird.type, { hit: hole.bird.flashing }]"
              :style="{ animationDuration: hole.bird.upMs + 'ms' }"
            >
              <svg viewBox="0 0 100 100" class="hb-svg"><use href="#hb-def"/></svg>
              <span v-if="hole.bird.type === 'boss'" class="hp-pip">×{{ hole.bird.hp }}</span>
            </div>
          </div>
        </div>
        <div class="floaty-layer" ref="floatyLayerRef"></div>
        <div class="shockwave-overlay" v-if="isShockwave"></div>
      </div>
    </template>

    <!-- Ended -->
    <template v-if="phase === 'ended'">
      <div class="gx-completed">
        <div class="gx-completed-anim"><span>🐦</span></div>
        <h3>{{ titleByScore }}</h3>
        <p class="result-msg">最终得分 <b>{{ score }}</b> · 最高连击 ×{{ maxComboReached.toFixed(1) }}</p>
      </div>

      <div class="gx-card">
        <div class="result-grid">
          <div class="result-item"><span class="label">击败蜂鸟</span><span class="value">{{ kills }}</span></div>
          <div class="result-item"><span class="label">G-Bomb</span><span class="value">{{ ultsUsed }}</span></div>
          <div class="result-item"><span class="label">命中率</span><span class="value">{{ hitRate }}%</span></div>
          <div class="result-item"><span class="label">称号</span><span class="value title-tag">{{ titleByScore }}</span></div>
        </div>

        <div v-if="!submitted" class="submit-form">
          <input v-model="nickname" maxlength="16" placeholder="留下你的棋士昵称" class="nick-input" />
          <button class="gx-btn gx-btn-primary gx-btn-block" :disabled="submitting || !nickname.trim()" @click="submitScore">
            {{ submitting ? '上传中...' : '提交战绩' }}
          </button>
        </div>
        <div v-else class="submitted-tip">✅ 战绩已上传到棋士排行榜</div>

        <div class="gx-actions">
          <button class="gx-btn gx-btn-primary" @click="restart">再来一局</button>
          <button class="gx-btn gx-btn-ghost" @click="goBack">返回列表</button>
        </div>
      </div>

      <div class="gx-card">
        <h3 class="gx-section-h">🏆 棋士排行榜 TOP 10</h3>
        <div v-if="loadingBoard" class="board-empty">加载中...</div>
        <div v-else-if="!leaderboard.length" class="board-empty">还没有人登榜，第一个就是你！</div>
        <ul v-else class="board-list">
          <li v-for="(row, i) in leaderboard" :key="row.id" class="board-row" :class="{ top1: i === 0, top2: i === 1, top3: i === 2 }">
            <span class="rank">{{ i + 1 }}</span>
            <span class="name">{{ row.nickname }}</span>
            <span class="score">{{ row.score }}</span>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/utils/api'
import { storage } from '@/utils/storage'
import { trackEvent, EVENTS } from '@/utils/stats'
import './games-shared.css'

const router = useRouter()

// ---------- Phase / state ----------
const phase = ref('idle') // idle | playing | ended
const remainingTime = ref(20)
const score = ref(0)
const kills = ref(0)
const ultsUsed = ref(0)
const taps = ref(0)
const hits = ref(0)
const ultGauge = ref(0) // 0-100
const comboCount = ref(0)
const maxComboReached = ref(1)
const isShockwave = ref(false)
const isShaking = ref(false)

const triggerScreenShake = () => {
  isShaking.value = true
  setTimeout(() => {
    isShaking.value = false
  }, 150)
}

const ultReady = computed(() => ultGauge.value >= 100)
const ultPercent = computed(() => Math.min(100, ultGauge.value))
const comboMult = computed(() => {
  const c = comboCount.value
  if (c >= 30) return 3.0
  if (c >= 20) return 2.0
  if (c >= 10) return 1.5
  return 1.0
})
const hitRate = computed(() => taps.value === 0 ? 0 : Math.round((hits.value / taps.value) * 100))
const titleByScore = computed(() => {
  const s = score.value
  if (s >= 5000) return '棋士亲卫队·御前侍卫'
  if (s >= 3000) return '版权解放军'
  if (s >= 1500) return '棋士护卫队长'
  if (s >= 500) return '合格守护者'
  return '路人棋士'
})

// ---------- Grid (whack-a-mole) ----------
const COLS = 4
const ROWS = 3
const TOTAL_HOLES = COLS * ROWS
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${COLS}, 1fr)`,
  gridTemplateRows: `repeat(${ROWS}, 1fr)`,
}))

// hole: { bird: null | { type, hp, upMs, expireAt, flashing } }
const holes = reactive(Array.from({ length: TOTAL_HOLES }, () => ({ bird: null })))

const floatyLayerRef = ref(null)
let spawnTimerId = 0
let tickRafId = 0
let countdownId = 0
let elapsedMs = 0
let lastTickTs = 0

function pickBirdType() {
  // Difficulty ramps: more diamond/boss in late game
  const t = elapsedMs / 1000 // 0..20
  const bossChance = 0.05 + Math.min(0.10, t * 0.005) // up to ~0.15
  const diamondChance = 0.18 + Math.min(0.12, t * 0.006)
  const r = Math.random()
  if (r < bossChance) return 'boss'
  if (r < bossChance + diamondChance) return 'diamond'
  return 'normal'
}

function spawnOne() {
  // find empty holes
  const empties = []
  for (let i = 0; i < holes.length; i++) if (!holes[i].bird) empties.push(i)
  if (!empties.length) return
  const idx = empties[Math.floor(Math.random() * empties.length)]
  const type = pickBirdType()
  const upMs = type === 'boss' ? 1400 : type === 'diamond' ? 700 : 1000
  const bird = {
    type,
    hp: type === 'boss' ? 3 : 1,
    upMs,
    expireAt: performance.now() + upMs,
    flashing: false,
  }
  holes[idx].bird = bird
}

function scheduleNextSpawn() {
  if (phase.value !== 'playing') return
  // dynamic interval: faster as time goes on; allow multi-spawn late
  const t = elapsedMs / 1000
  const base = Math.max(180, 520 - t * 18) // ms
  const jitter = Math.random() * 140
  spawnTimerId = setTimeout(() => {
    spawnOne()
    // late game: 35% chance of double spawn
    if (t > 10 && Math.random() < 0.35) spawnOne()
    scheduleNextSpawn()
  }, base + jitter)
}

function tick(ts) {
  if (phase.value !== 'playing') return
  if (!lastTickTs) lastTickTs = ts
  const dt = ts - lastTickTs
  lastTickTs = ts
  elapsedMs += dt
  const now = performance.now()

  // Auto-despawn missed birds → break combo
  for (let i = 0; i < holes.length; i++) {
    const b = holes[i].bird
    if (b && now >= b.expireAt) {
      holes[i].bird = null
      // missing breaks combo
      if (comboCount.value > 0) comboCount.value = 0
    }
  }

  tickRafId = requestAnimationFrame(tick)
}

// ---------- Input ----------
function onHoleTap(idx, ev) {
  if (phase.value !== 'playing') return
  taps.value++
  const hole = holes[idx]
  const b = hole.bird
  if (!b) {
    // miss tap on empty hole: no penalty, no gain (keep it forgiving)
    return
  }
  hits.value++
  comboCount.value++
  if (comboMult.value > maxComboReached.value) maxComboReached.value = comboMult.value
  triggerScreenShake()

  const rect = ev.currentTarget.getBoundingClientRect()
  const layerRect = floatyLayerRef.value?.getBoundingClientRect()
  const fx = layerRect ? (rect.left + rect.width / 2 - layerRect.left) : rect.width / 2
  const fy = layerRect ? (rect.top + rect.height / 2 - layerRect.top) : rect.height / 2

  if (b.type === 'boss') {
    b.hp -= 1
    if (b.hp <= 0) {
      const gain = Math.round(200 * comboMult.value)
      score.value += gain
      kills.value++
      ultGauge.value = Math.min(100, ultGauge.value + 18)
      hole.bird = null
      spawnFloaty(fx, fy, '+' + gain, '#fcd34d', true)
      vibrate(40)
    } else {
      // give it a bit more time so player can finish combo
      b.expireAt = performance.now() + 600
      b.flashing = true
      setTimeout(() => { if (hole.bird === b) b.flashing = false }, 120)
      spawnFloaty(fx, fy, '-1', '#fff')
      vibrate(10)
    }
    return
  }

  const baseScore = b.type === 'diamond' ? 50 : 10
  const gain = Math.round(baseScore * comboMult.value)
  score.value += gain
  kills.value++
  ultGauge.value = Math.min(100, ultGauge.value + (b.type === 'diamond' ? 10 : 5))
  hole.bird = null
  spawnFloaty(fx, fy, '+' + gain, b.type === 'diamond' ? '#7dd3fc' : '#ffd8a8')
  vibrate(b.type === 'diamond' ? 25 : 15)
}

function vibrate(ms) {
  if (navigator.vibrate) navigator.vibrate(ms)
}

function triggerUltimate() {
  if (!ultReady.value) return
  ultGauge.value = 0
  ultsUsed.value++
  isShockwave.value = true
  setTimeout(() => { isShockwave.value = false }, 800)
  let total = 0
  for (let i = 0; i < holes.length; i++) {
    const b = holes[i].bird
    if (!b) continue
    const base = b.type === 'boss' ? 200 : b.type === 'diamond' ? 50 : 10
    total += base
    kills.value++
    const layer = floatyLayerRef.value
    if (layer) {
      const cells = layer.parentElement.querySelectorAll('.hole')
      const cell = cells[i]
      if (cell) {
        const cr = cell.getBoundingClientRect()
        const lr = layer.getBoundingClientRect()
        spawnFloaty(cr.left + cr.width / 2 - lr.left, cr.top + cr.height / 2 - lr.top, '💥', '#fcd34d')
      }
    }
    holes[i].bird = null
  }
  if (total) {
    const gain = Math.round(total * comboMult.value)
    score.value += gain
    const layer = floatyLayerRef.value
    if (layer) {
      const lr = layer.getBoundingClientRect()
      spawnFloaty(lr.width / 2, lr.height / 2, 'G-BOMB +' + gain, '#fcd34d', true)
    }
  }
  vibrate([60, 30, 80])
}

// ---------- Floaty text ----------
function spawnFloaty(x, y, text, color, big) {
  const layer = floatyLayerRef.value
  if (!layer) return
  const el = document.createElement('div')
  el.className = 'floaty' + (big ? ' big' : '')
  el.textContent = text
  el.style.color = color
  el.style.left = x + 'px'
  el.style.top = y + 'px'
  layer.appendChild(el)
  setTimeout(() => el.remove(), 800)
}

// ---------- Game flow ----------
async function startGame() {
  trackEvent(EVENTS.GAME_START_HUMMINGBIRD_STRIKE)
  phase.value = 'playing'
  score.value = 0
  kills.value = 0
  ultsUsed.value = 0
  taps.value = 0
  hits.value = 0
  ultGauge.value = 0
  comboCount.value = 0
  maxComboReached.value = 1
  remainingTime.value = 20
  elapsedMs = 0
  lastTickTs = 0
  for (let i = 0; i < holes.length; i++) holes[i].bird = null
  submitted.value = false

  await nextTick()

  countdownId = setInterval(() => {
    remainingTime.value--
    if (remainingTime.value <= 0) endGame()
  }, 1000)
  tickRafId = requestAnimationFrame(tick)
  scheduleNextSpawn()
}

function endGame() {
  clearInterval(countdownId)
  clearTimeout(spawnTimerId)
  cancelAnimationFrame(tickRafId)
  phase.value = 'ended'
  for (let i = 0; i < holes.length; i++) holes[i].bird = null
  trackEvent(EVENTS.GAME_COMPLETE_HUMMINGBIRD_STRIKE, { score: score.value, kills: kills.value })
  loadLeaderboard()
}

function restart() {
  startGame()
}

function goBack() { router.push('/games') }

// ---------- Leaderboard ----------
const leaderboard = ref([])
const loadingBoard = ref(false)
const submitting = ref(false)
const submitted = ref(false)
const nickname = ref(storage.getNickName?.() || '')

async function loadLeaderboard() {
  loadingBoard.value = true
  try {
    const res = await apiClient.get('/game/hummingbird-strike/getLeaderboard')
    if (res.data?.code === 200) leaderboard.value = res.data.data || []
  } catch (_) {} finally {
    loadingBoard.value = false
  }
}

async function submitScore() {
  if (submitting.value || !nickname.value.trim()) return
  submitting.value = true
  try {
    const params = {
      nickname: nickname.value.trim(),
      score: score.value,
      maxCombo: Math.round(maxComboReached.value * 10),
      kills: kills.value,
      userId: storage.getUserId?.() || '',
    }
    const res = await apiClient.post('/game/hummingbird-strike/submit-score', null, { params })
    if (res.data?.code === 200) {
      submitted.value = true
      loadLeaderboard()
    }
  } catch (_) {} finally {
    submitting.value = false
  }
}

// ---------- Lifecycle ----------
onMounted(() => {
  loadLeaderboard()
})

onUnmounted(() => {
  cancelAnimationFrame(tickRafId)
  clearInterval(countdownId)
  clearTimeout(spawnTimerId)
})
</script>

<style scoped>
.rule-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
  display: grid;
  gap: 8px;
  font-size: 0.86rem;
  color: rgba(255, 255, 255, 0.78);
}
.rule-list li {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rule-icon {
  display: inline-block;
  width: 24px;
  height: 24px;
}
.normal-icon { color: #10b981; }
.diamond-icon { color: #22d3ee; }
.boss-icon { color: #ef4444; }

.legal-note {
  margin: 14px 0 0;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.42);
  text-align: center;
}

/* HUD */
.hud-card { padding: 14px !important; }
.hud-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}
.hud-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 12px;
}
.hud-item .label {
  font-size: 0.66rem;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 1px;
}
.hud-item .value {
  font-size: 1.2rem;
  font-weight: 800;
  color: #fff;
  font-variant-numeric: tabular-nums;
}
.hud-item .value.danger {
  color: #f87171;
  animation: pulse 0.8s infinite;
}
.hud-item .value.combo {
  background: linear-gradient(135deg, #fcd34d, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
@keyframes pulse {
  50% { transform: scale(1.1); }
}

/* Ult bar */
.ult-bar-wrap {
  position: relative;
  height: 26px;
  background: rgba(0, 0, 0, 0.32);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 999px;
  overflow: hidden;
}
.ult-bar-wrap.clickable { cursor: pointer; }
.ult-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6);
  background-size: 300% 100%;
  transition: width 0.18s ease;
  box-shadow: 0 0 14px rgba(236, 72, 153, 0.6);
  animation: gradientMove 3s linear infinite;
}
.ult-bar.ready {
  background: linear-gradient(90deg, #fcd34d, #f59e0b, #ef4444, #fcd34d);
  background-size: 300% 100%;
  animation: gradientMove 1.5s linear infinite, ultGlow 0.6s infinite alternate;
}
@keyframes gradientMove {
  0% { background-position: 0% 0; }
  100% { background-position: 100% 0; }
}
@keyframes ultGlow {
  to { box-shadow: 0 0 24px rgba(252, 211, 77, 0.9); }
}
.ult-label {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 0.78rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  letter-spacing: 0.5px;
  pointer-events: none;
}

/* Grid board */
.grid-card {
  position: relative;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  box-sizing: border-box;
  border-radius: 18px;
  padding: 16px;
  background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
  border: 2px solid #e94560;
  box-shadow: 0 0 30px rgba(233, 69, 96, 0.3), inset 0 0 20px rgba(0,0,0,0.5);
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  overflow: hidden;
}
.grid-card.shockwave-active {
  animation: screenShake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}
/* 击中震屏：更高频、更清脆的微振动 */
.grid-card.shake-active {
  animation: sharpShake 0.15s cubic-bezier(.36,.07,.19,.97) both;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  perspective: 1000px;
}
@keyframes sharpShake {
  10%, 90% { transform: translate3d(-3px, 1px, 0) rotate(-0.5deg); }
  20%, 80% { transform: translate3d(4px, -1px, 0) rotate(0.5deg); }
  30%, 50%, 70% { transform: translate3d(-5px, -2px, 0) rotate(-0.8deg); }
  40%, 60% { transform: translate3d(5px, 2px, 0) rotate(0.8deg); }
}
@keyframes screenShake {
  10%, 90% { transform: translate3d(-2px, 0, 0); }
  20%, 80% { transform: translate3d(4px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-8px, 0, 0); }
  40%, 60% { transform: translate3d(8px, 0, 0); }
}
.shockwave-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  background: radial-gradient(circle, rgba(252,211,77,0.9) 0%, rgba(239,68,68,0.6) 40%, rgba(236,72,153,0) 80%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: shockwaveAnim 0.7s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
  pointer-events: none;
  z-index: 10;
  mix-blend-mode: screen;
}
@keyframes shockwaveAnim {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(100); opacity: 0; }
}
.grid-board {
  display: grid;
  gap: 12px;
  width: 100%;
  aspect-ratio: 4 / 3;
  max-height: 60vh;
  min-height: 320px;
}
.hole {
  position: relative;
  border-radius: 16px;
  background: linear-gradient(145deg, #2c2c38, #1a1a24);
  border: 2px solid #3f3f4e;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.8), 0 8px 16px rgba(0,0,0,0.4);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.08s ease;
}
.hole:active {
  transform: scale(0.96);
}
.hole-inner {
  position: absolute;
  inset: 10%;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 50%, #050505 0%, #151515 50%, #222 100%);
  border: 2px solid #111;
  box-shadow: inset 0 0 20px #000, 0 2px 4px rgba(255,255,255,0.05);
  z-index: 0;
}
.hole-mouth {
  position: absolute;
  left: 35%;
  right: 35%;
  top: 35%;
  bottom: 35%;
  background: radial-gradient(circle at 30% 30%, #333 0%, #111 100%);
  border-radius: 50%;
  box-shadow: 0 5px 10px rgba(0,0,0,0.8);
  z-index: 2;
  pointer-events: none;
}
.bird {
  position: absolute;
  left: 10%;
  top: 10%;
  width: 80%;
  height: 80%;
  display: grid;
  place-items: center;
  z-index: 3;
  animation-name: birdPopCenter;
  animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  animation-fill-mode: forwards;
  pointer-events: none;
  transform-origin: center center;
}
@keyframes birdPopCenter {
  0% { transform: scale(0); opacity: 0; }
  15% { transform: scale(1); opacity: 1; }
  85% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0); opacity: 0; }
}
.hb-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 6px 10px rgba(0,0,0,0.6));
  animation: birdBob 0.6s infinite alternate ease-in-out;
}
@keyframes birdBob {
  to { transform: translateY(-4px) rotate(-3deg); }
}
.wing {
  transform-origin: 45px 35px;
  animation: flap 0.06s infinite alternate linear;
}
@keyframes flap {
  0% { transform: rotate(-10deg); }
  100% { transform: rotate(45deg); }
}
.bird.hit .hb-svg {
  animation: birdHit 0.18s ease;
}
@keyframes birdHit {
  0% { transform: scale(1); filter: brightness(2.5) drop-shadow(0 0 15px #fff); }
  100% { transform: scale(1.2); filter: brightness(1) drop-shadow(0 6px 10px rgba(0,0,0,0.6)); }
}
.bird-normal { color: #10b981; }
.bird-diamond { color: #22d3ee; }
.bird-boss { color: #ef4444; }

.bird-diamond .hb-svg {
  filter: drop-shadow(0 0 12px #22d3ee) drop-shadow(0 6px 10px rgba(0,0,0,0.6));
}
.bird-boss {
  width: 90%;
  height: 90%;
  left: 5%;
  top: 5%;
}
.bird-boss .hb-svg {
  filter: drop-shadow(0 0 16px #ef4444) drop-shadow(0 6px 10px rgba(0,0,0,0.6));
}
.hp-pip {
  position: absolute;
  top: 0;
  right: 4%;
  background: rgba(239, 68, 68, 0.92);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}

.floaty-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}
.floaty-layer :deep(.floaty),
.floaty-layer .floaty {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 1rem;
  font-weight: 800;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.7);
  animation: floatup 0.8s ease-out forwards;
  pointer-events: none;
  white-space: nowrap;
}
.floaty-layer .floaty.big {
  font-size: 1.6rem;
}
@keyframes floatup {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
  20% { opacity: 1; transform: translate(-50%, -60%) scale(1.15); }
  100% { opacity: 0; transform: translate(-50%, -120%) scale(1); }
}

/* Result */
.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 14px;
}
.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 14px;
}
.result-item .label {
  font-size: 0.74rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
}
.result-item .value {
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
  font-variant-numeric: tabular-nums;
}
.title-tag {
  font-size: 0.86rem !important;
  background: linear-gradient(135deg, #fcd34d, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Submit form */
.submit-form {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}
.nick-input {
  height: 42px;
  padding: 0 14px;
  background: rgba(0, 0, 0, 0.22);
  color: #fff;
  font-size: 0.92rem;
  border: 1.5px solid rgba(255, 255, 255, 0.10);
  border-radius: 12px;
}
.nick-input:focus {
  outline: none;
  border-color: var(--gx-accent);
  box-shadow: 0 0 0 3px var(--gx-accent-soft);
}
.submitted-tip {
  text-align: center;
  font-size: 0.86rem;
  color: #34d399;
  margin-bottom: 12px;
}

/* Leaderboard */
.board-empty {
  text-align: center;
  font-size: 0.84rem;
  color: rgba(255, 255, 255, 0.5);
  padding: 18px 0;
}
.board-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}
.board-row {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  font-size: 0.88rem;
}
.board-row .rank {
  font-weight: 800;
  color: rgba(255, 255, 255, 0.55);
  text-align: center;
}
.board-row .name {
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.board-row .combo-tag {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 8px;
  border-radius: 999px;
}
.board-row .score {
  font-weight: 800;
  color: var(--gx-accent, #f472b6);
  font-variant-numeric: tabular-nums;
}
.board-row.top1 { background: linear-gradient(90deg, rgba(252,211,77,0.20), rgba(252,211,77,0.04)); }
.board-row.top1 .rank { color: #fcd34d; }
.board-row.top2 .rank { color: #d1d5db; }
.board-row.top3 .rank { color: #fdba74; }

/* Mobile tweaks */
@media (max-width: 480px) {
  .grid-card { padding: 10px; border-radius: 14px; }
  .grid-board { gap: 6px; min-height: auto; }
  .hud-card { padding: 10px !important; }
  .hud-item { padding: 6px; }
  .hud-item .value { font-size: 1rem; }
  .floaty-layer .floaty { font-size: 0.86rem; }
  .floaty-layer .floaty.big { font-size: 1.3rem; }
  .board-row { padding: 8px 10px; font-size: 0.8rem; gap: 6px; grid-template-columns: 24px 1fr auto; }
  .board-row .rank { width: auto; }
  .rule-list { font-size: 0.8rem; }
}
</style>
