<template>
  <div class="ticket-rush-game gx-page gx-rose">
    <header class="gx-header">
      <button class="gx-back" @click="goBack" aria-label="返回">‹</button>
      <div class="gx-title-wrap">
        <span class="gx-icon">🎫</span>
        <h2 class="gx-title">抢票模拟器</h2>
      </div>
      <span class="gx-spacer" />
    </header>
    <p class="gx-subtitle" v-if="!gameStarted && !gameEnded">
      体验真实抢票的高并发场景，感受抢票的激烈竞争！
    </p>

    <!-- 设置 -->
    <div class="gx-card" v-if="!gameStarted && !gameEnded">
      <h3 class="gx-section-h">抢票设置</h3>
      <div class="setup-form">
        <div class="form-row">
          <div class="form-group">
            <label>抢票人数</label>
            <input type="number" v-model="playerCount" min="10" max="10000" placeholder="10 - 10000" />
            <small>将创建对应数量的虚拟用户</small>
          </div>
          <div class="form-group">
            <label>抢票张数</label>
            <input type="number" v-model="ticketCount" min="1" max="1000" placeholder="1 - 1000" />
            <small>票数越少，竞争越激烈</small>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>倒计时（秒）</label>
            <input type="number" v-model="countdownSeconds" min="2" max="60" placeholder="2 - 60" />
          </div>
          <div class="form-group">
            <label>请求间隔（毫秒）</label>
            <input type="number" v-model="requestInterval" min="50" max="500" placeholder="50 - 500" />
            <small>越小越激烈</small>
          </div>
        </div>
      </div>
      <div class="gx-actions">
        <button class="gx-btn gx-btn-primary gx-btn-block" :disabled="!canStartGame" @click="startGame">
          开始抢票！
        </button>
      </div>
    </div>

    <!-- 进行中 -->
    <template v-if="gameStarted && !gameEnded">
      <div class="gx-card countdown-card" :class="{ 'heartbeat-danger': remainingTime > 0 && remainingTime <= 3 }">
        <div class="countdown-number">{{ remainingTime }}</div>
        <div class="countdown-label">{{ remainingTime > 0 ? '抢票开始倒计时' : '抢票进行中' }}</div>
      </div>

      <div class="gx-card">
        <h3 class="gx-section-h">实时抢票状态</h3>
        <div class="status-grid">
          <div class="status-item">
            <span class="label">总请求</span>
            <span class="value">{{ totalRequests }}</span>
          </div>
          <div class="status-item">
            <span class="label">成功</span>
            <span class="value success">{{ successfulRequests }}</span>
          </div>
          <div class="status-item">
            <span class="label">失败</span>
            <span class="value failed">{{ failedRequests }}</span>
          </div>
          <div class="status-item">
            <span class="label">成功率</span>
            <span class="value">{{ requestSuccessRate }}%</span>
          </div>
        </div>
      </div>

      <div class="gx-card">
        <h3 class="gx-section-h">剩余票数</h3>
        <div class="ticket-progress-container">
          <div class="ticket-progress-bar" :style="{ width: (remainingTickets / ticketCount * 100) + '%' }"></div>
        </div>
        <div class="ticket-progress-text">{{ remainingTickets }} / {{ ticketCount }}</div>
      </div>

      <div class="gx-card rush-card">
        <button
          class="rush-btn"
          :class="{ 'success': userHasTicket }"
          :disabled="!canGrabTicket"
          @click="userGrabTicket"
        >
          {{ userHasTicket ? '🎉 抢票成功！' : '🎫 我也要抢票！' }}
        </button>
        <p class="rush-hint">
          {{ remainingTime > 0
            ? `等待倒计时结束（${remainingTime}秒）`
            : '点击按钮参与抢票，与虚拟用户竞争！'
          }}
        </p>
        <p class="status-message" v-if="statusMessage">{{ statusMessage }}</p>
      </div>
    </template>

    <!-- 结果 -->
    <template v-if="gameEnded">
      <div class="gx-completed">
        <div class="gx-completed-anim"><span>🎫</span></div>
        <h3>抢票结束</h3>
        <p v-if="ticketsGrabbed > 0" class="result-msg success">
          🎉 恭喜你抢到了 {{ ticketsGrabbed }} 张票！
        </p>
        <p v-else class="result-msg failed">
          😢 这次没抢到票，下次加油！
        </p>
      </div>

      <div class="gx-card">
        <div class="result-grid">
          <div class="result-item">
            <span class="label">抢票人数</span>
            <span class="value">{{ playerCount }}</span>
          </div>
          <div class="result-item">
            <span class="label">抢票张数</span>
            <span class="value">{{ ticketCount }}</span>
          </div>
          <div class="result-item">
            <span class="label">你抢到</span>
            <span class="value" :class="{ 'success': ticketsGrabbed > 0, 'failed': ticketsGrabbed === 0 }">
              {{ ticketsGrabbed }} 张
            </span>
          </div>
          <div class="result-item">
            <span class="label">总请求</span>
            <span class="value">{{ totalRequests }}</span>
          </div>
          <div class="result-item">
            <span class="label">成功率</span>
            <span class="value">{{ requestSuccessRate }}%</span>
          </div>
        </div>
        <div class="gx-actions">
          <button class="gx-btn gx-btn-primary" @click="restartGame">再来一次</button>
          <button class="gx-btn gx-btn-ghost" @click="goBack">返回列表</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/utils/api'
import { trackEvent, EVENTS } from '@/utils/stats'
import './games-shared.css'

const router = useRouter()

const gameStarted = ref(false)
const gameEnded = ref(false)
const remainingTime = ref(0)
const ticketsGrabbed = ref(0)
const statusMessage = ref('')
const userHasTicket = ref(false)

const playerCount = ref(100)
const ticketCount = ref(30)
const countdownSeconds = ref(5)
const requestInterval = ref(100)

const totalRequests = ref(0)
const successfulRequests = ref(0)
const failedRequests = ref(0)
const remainingTickets = ref(0)

const virtualUsers = ref([])

let countdownTimer = null
let monitorInterval = null

const canStartGame = computed(() =>
  playerCount.value >= 10 &&
  ticketCount.value > 0 &&
  playerCount.value <= 10000 &&
  ticketCount.value <= 1000 &&
  countdownSeconds.value >= 2 &&
  requestInterval.value >= 50
)

const canGrabTicket = computed(() =>
  gameStarted.value &&
  !gameEnded.value &&
  remainingTime.value === 0 &&
  remainingTickets.value > 0 &&
  !userHasTicket.value
)

const requestSuccessRate = computed(() => {
  if (totalRequests.value === 0) return 0
  return Math.round((successfulRequests.value / totalRequests.value) * 100)
})

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function setStock(ticketId, stock) {
  try {
    const response = await apiClient.get('/game/ticket/setStock', {
      params: { ticketId, stock }
    })
    return response.data.code === 200
  } catch { return false }
}

async function clearStock(ticketId) {
  try {
    const response = await apiClient.get('/game/ticket/clearStock', { params: { ticketId } })
    return response.data.code === 200
  } catch { return false }
}

async function grabTicketApi(userId) {
  try {
    if (Math.random() < 0.3) {
      return { success: false, message: '随机失败' }
    }
    const response = await apiClient.post('/game/ticket/robTicket', null, {
      params: { userId, ticketId: '1' }
    })
    if (response.data.code === 200) {
      return { success: true, message: response.data.data || '抢票成功' }
    }
    return { success: false, message: response.data.data || response.data.message || '抢票失败' }
  } catch {
    return { success: false, message: '网络错误' }
  }
}

async function startVirtualUser(user) {
  while (gameStarted.value && !gameEnded.value && remainingTickets.value > 0 && !user.success) {
    try {
      await sleep(Math.random() * 190 + 10)
      if (!gameStarted.value || gameEnded.value || remainingTickets.value <= 0) break
      user.status = '抢票中...'
      user.active = true
      totalRequests.value++
      const result = await grabTicketApi(user.userId)
      if (result.success && remainingTickets.value > 0) {
        user.success = true
        user.status = '成功！'
        successfulRequests.value++
        remainingTickets.value--
        setTimeout(() => resetUserStatus(user), 2000)
      } else {
        user.status = '失败'
        user.failed = true
        failedRequests.value++
        setTimeout(() => {
          if (!user.success && gameStarted.value && !gameEnded.value && remainingTickets.value > 0) {
            user.status = '等待中'
            user.failed = false
            user.active = false
          }
        }, 1000)
      }
    } catch {
      user.status = '错误'
      user.failed = true
      failedRequests.value++
      setTimeout(() => {
        if (!user.success && gameStarted.value && !gameEnded.value && remainingTickets.value > 0) {
          user.status = '等待中'
          user.failed = false
          user.active = false
        }
      }, 1000)
    }
  }
  if (!user.success) user.status = '等待中'
}

const resetUserStatus = (user) => {
  user.status = '等待中'
  user.success = false
  user.failed = false
  user.active = false
}

const initVirtualUsers = () => {
  virtualUsers.value = []
  for (let i = 0; i < playerCount.value; i++) {
    virtualUsers.value.push({
      id: i,
      displayId: `U${i + 1}`,
      userId: i,
      status: '等待中',
      success: false,
      failed: false,
      active: false
    })
  }
}

const startGame = async () => {
  try {
    trackEvent(EVENTS.GAME_START_TICKET_RUSH)
    const stockSet = await setStock('1', ticketCount.value.toString())
    if (!stockSet) {
      statusMessage.value = '❌ 设置库存失败，请重试！'
      return
    }
    gameStarted.value = true
    gameEnded.value = false
    ticketsGrabbed.value = 0
    remainingTime.value = countdownSeconds.value
    remainingTickets.value = ticketCount.value
    totalRequests.value = 0
    successfulRequests.value = 0
    failedRequests.value = 0
    statusMessage.value = '✅ 准备开始抢票！'
    userHasTicket.value = false
    initVirtualUsers()
    countdownTimer = setInterval(() => {
      remainingTime.value--
      if (remainingTime.value <= 0) startTicketPhase()
    }, 1000)
  } catch {
    statusMessage.value = '❌ 开始游戏失败，请重试！'
  }
}

const startTicketPhase = () => {
  clearInterval(countdownTimer)
  remainingTime.value = 0
  statusMessage.value = '🔥 抢票开始！'
  virtualUsers.value.forEach(user => startVirtualUser(user))
  startGameMonitor()
}

const startGameMonitor = () => {
  if (monitorInterval) clearInterval(monitorInterval)
  monitorInterval = setInterval(() => {
    if (remainingTickets.value <= 0) {
      clearInterval(monitorInterval)
      endGame()
      return
    }
    const allFinished = virtualUsers.value.every(u => u.success || u.status === '等待中')
    if (allFinished && remainingTickets.value > 0) {
      clearInterval(monitorInterval)
      endGame()
    }
  }, 1000)
}

const userGrabTicket = async () => {
  if (remainingTickets.value <= 0 || remainingTime.value > 0 || userHasTicket.value) return
  totalRequests.value++
  
  // 触觉反馈
  if (navigator.vibrate) {
    navigator.vibrate([50])
  }
  
  try {
    const result = await grabTicketApi(114514)
    if (result.success && remainingTickets.value > 0) {
      ticketsGrabbed.value++
      remainingTickets.value--
      successfulRequests.value++
      statusMessage.value = '🎉 抢票成功！'
      userHasTicket.value = true
      if (navigator.vibrate) navigator.vibrate([50, 50, 50])
    } else {
      failedRequests.value++
      statusMessage.value = '😢 抢票失败，继续加油！'
    }
  } catch {
    failedRequests.value++
    statusMessage.value = '😢 网络错误'
  }
  setTimeout(() => { statusMessage.value = '' }, 2000)
}

const endGame = async () => {
  clearInterval(countdownTimer)
  if (monitorInterval) { clearInterval(monitorInterval); monitorInterval = null }
  gameStarted.value = false
  gameEnded.value = true
  trackEvent(EVENTS.GAME_COMPLETE_TICKET_RUSH, { grabbed: ticketsGrabbed.value })
  try {
    await clearStock('1')
  } catch {}
}

const restartGame = () => {
  gameStarted.value = false
  gameEnded.value = false
  ticketsGrabbed.value = 0
  remainingTime.value = 0
  remainingTickets.value = 0
  totalRequests.value = 0
  successfulRequests.value = 0
  failedRequests.value = 0
  statusMessage.value = ''
  userHasTicket.value = false
  virtualUsers.value = []
}

const goBack = () => router.push('/games')

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  if (monitorInterval) { clearInterval(monitorInterval); monitorInterval = null }
  gameStarted.value = false
})
</script>

<style scoped>
/* ============================================================
 * Ticket Rush Game - 重新整理为单一来源样式
 * ============================================================ */

/* ---------- 设置表单 ---------- */
.setup-form {
  display: grid;
  gap: 12px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 14px;
}
.form-group label {
  font-size: 0.78rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.82);
  letter-spacing: 0.3px;
}
.form-group input {
  height: 42px;
  padding: 0 14px;
  background: rgba(0, 0, 0, 0.22);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1.5px solid rgba(255, 255, 255, 0.10);
  border-radius: 12px;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  font-variant-numeric: tabular-nums;
}
.form-group input:focus {
  outline: none;
  border-color: var(--gx-accent);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 0 3px var(--gx-accent-soft);
}
.form-group small {
  font-size: 0.66rem;
  color: rgba(255, 255, 255, 0.48);
}

/* ---------- 倒计时 ---------- */
.countdown-card {
  text-align: center;
  padding: 24px 16px !important;
  background:
    radial-gradient(circle at 50% 18%, var(--gx-accent-soft), transparent 40%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.03)),
    var(--gx-panel) !important;
}
.countdown-number {
  font-size: clamp(3rem, 12vw, 5.6rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.06em;
  background: linear-gradient(135deg, #fff, #ffd8d3);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 24px var(--gx-accent-glow));
  font-variant-numeric: tabular-nums;
}
.countdown-label {
  margin-top: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 1.5px;
  color: rgba(255, 255, 255, 0.62);
  text-transform: uppercase;
}

.heartbeat-danger {
  animation: dangerHeartbeat 0.8s ease-in-out infinite;
  box-shadow: 0 0 30px rgba(248, 113, 113, 0.4) !important;
}
.heartbeat-danger .countdown-number {
  color: var(--gx-danger);
  background: none;
  -webkit-text-fill-color: var(--gx-danger);
  text-shadow: 0 0 20px rgba(248, 113, 113, 0.8);
}
@keyframes dangerHeartbeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* ---------- 状态网格 ---------- */
.status-grid,
.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.status-item,
.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 14px;
}
.status-item .label,
.result-item .label {
  font-size: 0.74rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
}
.status-item .value,
.result-item .value {
  font-size: 1.05rem;
  font-weight: 800;
  color: #fff;
  font-variant-numeric: tabular-nums;
}
.status-item .value.success,
.result-item .value.success { color: var(--gx-success); }
.status-item .value.failed,
.result-item .value.failed { color: var(--gx-danger); }

/* ---------- 进度条替代网格 ---------- */
.ticket-progress-container {
  height: 24px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  margin-bottom: 8px;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);
}
.ticket-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--gx-accent), var(--gx-accent-2));
  border-radius: 12px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 14px var(--gx-accent-glow);
}
.ticket-progress-text {
  text-align: center;
  font-size: 1.2rem;
  font-weight: 800;
  color: #fff;
  font-variant-numeric: tabular-nums;
  font-family: 'DIN Alternate', 'Inter', monospace;
}

/* ---------- 抢票主操作区 ---------- */
.rush-card {
  text-align: center;
  background:
    radial-gradient(circle at 50% 0%, var(--gx-accent-soft), transparent 42%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.03)),
    var(--gx-panel) !important;
}
.rush-btn {
  width: 100%;
  min-height: 60px;
  padding: 0 1.6rem;
  background: linear-gradient(135deg, var(--gx-accent), var(--gx-accent-2));
  color: #fff;
  border: none;
  border-radius: 999px;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.6px;
  cursor: pointer;
  box-shadow: 0 16px 38px var(--gx-accent-glow), inset 0 1px 0 rgba(255, 255, 255, 0.24);
  transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
  position: relative;
  overflow: hidden;
}
.rush-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transform: skewX(-20deg);
  animation: sweep 2.5s infinite;
}
@keyframes sweep {
  0% { left: -100%; }
  20%, 100% { left: 200%; }
}
.rush-btn:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-2px) scale(1.01);
}
.rush-btn:active:not(:disabled) { transform: scale(0.92); }
.rush-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.rush-btn:disabled::after {
  display: none;
}
.rush-btn.success {
  background: linear-gradient(135deg, #10B981, #34D399);
  box-shadow: 0 16px 38px rgba(52, 211, 153, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.22);
  cursor: default;
}
.rush-btn.success::after {
  display: none;
}

.rush-hint {
  margin: 12px 0 0;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.55);
}
.status-message {
  margin-top: 8px;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--primary-light, #ffd8d3);
}

/* ---------- 结果文案 ---------- */
.result-msg {
  margin: 8px 0;
  font-size: 1rem;
  font-weight: 700;
}
.result-msg.success { color: var(--gx-success); }
.result-msg.failed { color: var(--gx-danger); }

/* ---------- 移动端适配 ---------- */
@media (max-width: 480px) {
  .form-row { grid-template-columns: 1fr; gap: 8px; }
  .form-group { padding: 12px; }
  .form-group input { height: 40px; font-size: 0.86rem; }
  .countdown-number { font-size: clamp(2.4rem, 11vw, 4rem); }
  .countdown-label { font-size: 0.72rem; letter-spacing: 1px; }
  .ticket-progress-container { height: 20px; }
  .ticket-progress-text { font-size: 1.05rem; }
  .rush-btn { min-height: 52px; font-size: 0.98rem; }
  .status-item .value,
  .result-item .value { font-size: 0.94rem; }
}
</style>
