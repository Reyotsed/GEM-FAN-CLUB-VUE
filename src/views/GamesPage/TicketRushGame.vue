<template>
  <div class="ticket-rush-game">
    <div class="game-header">
      <h2 class="game-title">
        <span class="icon">🎫</span>
        抢票模拟器
      </h2>
      <p class="game-description">体验真实抢票的高并发场景，感受抢票的激烈竞争！</p>
    </div>

    <!-- 游戏设置区域 -->
    <div class="game-setup" v-if="!gameStarted">
      <div class="setup-form">
        <div class="form-row">
          <div class="form-group">
            <label for="playerCount">抢票人数：</label>
            <input 
              type="number" 
              id="playerCount" 
              v-model="playerCount" 
              min="10" 
              max="10000"
              placeholder="请输入抢票人数"
            />
            <small class="form-hint">将创建对应数量的虚拟用户进行抢票</small>
          </div>
          
          <div class="form-group">
            <label for="ticketCount">抢票张数：</label>
            <input 
              type="number" 
              id="ticketCount" 
              v-model="ticketCount" 
              min="1" 
              max="1000"
              placeholder="请输入抢票张数"
            />
            <small class="form-hint">票数越多，竞争越激烈</small>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="countdown">倒计时（秒）：</label>
            <input 
              type="number" 
              id="countdown" 
              v-model="countdownSeconds" 
              min="5" 
              max="60"
              placeholder="请输入倒计时秒数"
            />
          </div>

          <div class="form-group">
            <label for="requestInterval">请求间隔（毫秒）：</label>
            <input 
              type="number" 
              id="requestInterval" 
              v-model="requestInterval" 
              min="50" 
              max="500"
              placeholder="请输入请求间隔"
            />
            <small class="form-hint">数值越小，抢票越激烈</small>
          </div>
        </div>
        
        <button 
          class="start-btn" 
          @click="startGame"
          :disabled="!canStartGame"
        >
          开始抢票！
        </button>
      </div>
    </div>

    <!-- 游戏进行中区域 -->
    <div class="game-playing" v-if="gameStarted && !gameEnded">
      <div class="countdown-display">
        <div class="countdown-number">{{ remainingTime }}</div>
        <div class="countdown-label">{{ remainingTime > 0 ? '抢票开始倒计时' : '抢票进行中' }}</div>
      </div>
    
      <!-- 实时抢票状态 -->
      <div class="rush-status">
        <h4>实时抢票状态</h4>
        <div class="status-grid">
          <div class="status-item">
            <span class="label">总请求数：</span>
            <span class="value">{{ totalRequests }}</span>
          </div>
          <div class="status-item">
            <span class="label">成功请求：</span>
            <span class="value success">{{ successfulRequests }}</span>
          </div>
          <div class="status-item">
            <span class="label">失败请求：</span>
            <span class="value failed">{{ failedRequests }}</span>
          </div>
          <div class="status-item">
            <span class="label">成功率：</span>
            <span class="value">{{ requestSuccessRate }}%</span>
          </div>
        </div>
      </div>
      
      <!-- 虚拟用户抢票动画 -->
      <div class="virtual-users">
        <h4>虚拟用户抢票中... ({{ playerCount }}人)</h4>
        <div class="users-container">
          <div 
            v-for="user in displayUsers" 
            :key="user.id"
            class="virtual-user"
            :class="{ 'success': user.success, 'failed': user.failed, 'active': user.active }"
          >
            <span class="user-icon">👤</span>
            <span class="user-id">{{ user.displayId }}</span>
            <span class="user-status">{{ user.status }}</span>
          </div>
          <div v-if="playerCount > 100" class="more-users">
            <span class="more-icon">...</span>
            <span class="more-text">还有{{ playerCount - 100 }}人</span>
          </div>
        </div>
      </div>

      <!-- 用户抢票按钮 -->
      <div class="rush-button-container">
                 <button 
           class="rush-btn" 
           @click="userGrabTicket"
           :disabled="!canGrabTicket"
           :class="{ 'success': userHasTicket }"
         >
           {{ userHasTicket ? '🎉 抢票成功！' : '🎫 我也要抢票！' }}
         </button>
        <p class="rush-hint">
          {{ remainingTime > 0 
            ? `请等待倒计时结束（${remainingTime}秒）后开始抢票` 
            : '每个用户只能抢一张票，点击按钮参与抢票，与虚拟用户竞争！' 
          }}
        </p>
      </div>
      
      <div class="status-message" v-if="statusMessage">
        {{ statusMessage }}
      </div>
    </div>

    <!-- 游戏结果区域 -->
    <div class="game-result" v-if="gameEnded">
      <div class="result-header">
        <h3>抢票结果</h3>
      </div>
      
      <div class="result-content">
        <div class="result-item">
          <span class="label">抢票人数：</span>
          <span class="value">{{ playerCount }}</span>
        </div>
        <div class="result-item">
          <span class="label">抢票张数：</span>
          <span class="value">{{ ticketCount }}</span>
        </div>
        <div class="result-item">
          <span class="label">你抢到：</span>
          <span class="value" :class="{ 'success': ticketsGrabbed > 0, 'failed': ticketsGrabbed === 0 }">
            {{ ticketsGrabbed }} 张
          </span>
        </div>
        <div class="result-item">
          <span class="label">总请求数：</span>
          <span class="value">{{ totalRequests }}</span>
        </div>
        <div class="result-item">
          <span class="label">成功率：</span>
          <span class="value">{{ requestSuccessRate }}%</span>
        </div>
      </div>
      
      <div class="result-message">
        <p v-if="ticketsGrabbed > 0" class="success-message">
          🎉 恭喜你在激烈的竞争中抢到了 {{ ticketsGrabbed }} 张票！
        </p>
        <p v-else class="failed-message">
          😢 很遗憾，这次没有抢到票，下次加油！
        </p>
      </div>
      
      <div class="action-buttons">
        <button class="restart-btn" @click="restartGame">再来一次</button>
        <button class="back-btn" @click="goBack">返回游戏列表</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/utils/api';

const router = useRouter()

// 游戏状态
const gameStarted = ref(false)
const gameEnded = ref(false)
const remainingTime = ref(0)
const ticketsGrabbed = ref(0)
const statusMessage = ref('')
const userHasTicket = ref(false) // 新增：用户是否已经抢到票

// 游戏设置
const playerCount = ref(100)
const ticketCount = ref(30)
const countdownSeconds = ref(5)
const requestInterval = ref(100)

// 抢票统计
const totalRequests = ref(0)
const successfulRequests = ref(0)
const failedRequests = ref(0)
const remainingTickets = ref(0)

// 虚拟用户
const virtualUsers = ref([])

// 计时器
let countdownTimer = null
let ticketRequestTimer = null

// 计算属性
const canStartGame = computed(() => {
  return playerCount.value >= 10 && 
         ticketCount.value > 0 && 
         playerCount.value <= 10000 &&
         ticketCount.value <= 1000 &&
         countdownSeconds.value >= 2 &&
         requestInterval.value >= 50
})

const canGrabTicket = computed(() => {
  return gameStarted.value && 
         !gameEnded.value && 
         remainingTime.value === 0 && // 倒计时结束后才能抢票
         remainingTickets.value > 0 && 
         !userHasTicket.value // 用户还没有抢到票
})

const requestSuccessRate = computed(() => {
  if (totalRequests.value === 0) return 0
  return Math.round((successfulRequests.value / totalRequests.value) * 100)
})

// 显示的用户（最多100个）
const displayUsers = computed(() => {
  return virtualUsers.value.slice(0, 100)
})

// 生成随机用户ID
const generateUserId = () => {
  return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
}

// 睡眠函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 设置库存接口
async function setStock(ticketId, stock) {
  try {
    const response = await apiClient.get('/game/ticket/setStock', {
      params: {
        ticketId: ticketId,
        stock: stock
      }
    })
    
    return response.data.code === 200
  } catch (error) {
    return false
  }
}

// Clear stock API
async function clearStock(ticketId) {
  try {
    const response = await apiClient.get('/game/ticket/clearStock', {
      params: {
        ticketId: ticketId
      }
    })
    
    return response.data.code === 200
  } catch (error) {
    return false
  }
}

// 抢票API调用函数
async function grabTicketApi(userId) {
  try {
    // 30% chance of random failure for realism
    const randomValue = Math.random();
    if (randomValue < 0.3) {
      return {
        success: false,
        message: '随机失败'
      }
    }
    
    // 调用真实的后端接口
     const response = await apiClient.post('/game/ticket/robTicket', null, {
       params: {
         userId: userId,
         ticketId: "1"
       }
     })
    
    if (response.data.code === 200) {
      return {
        success: true,
        message: response.data.data || '抢票成功'
      }
    } else {
      return {
        success: false,
        message: response.data.data || response.data.message || '抢票失败'
      }
    }
  } catch (error) {
    return {
      success: false,
      message: '网络错误，请重试'
    }
  }
}

// 定义虚拟用户的核心行为
async function startVirtualUser(user) {
  while (gameStarted.value && !gameEnded.value && remainingTickets.value > 0 && !user.success) {
    try {
      // 1. 模拟思考/网络延迟（核心！）
      // 随机等待 10ms 到 200ms（大幅减少延迟）
      const randomDelay = Math.random() * 190 + 10;
      await sleep(randomDelay);

      // 再次检查抢票是否已结束
      if (!gameStarted.value || gameEnded.value || remainingTickets.value <= 0) {
        break;
      }

      // 更新用户状态
      user.status = '抢票中...';
      user.active = true;
      totalRequests.value++;

      const result = await grabTicketApi(user.userId);

      // 3. 更新自身状态
      if (result.success && remainingTickets.value > 0) {
        user.success = true;
        user.status = '抢票成功！';
        successfulRequests.value++;
        remainingTickets.value--;
        
        setTimeout(() => resetUserStatus(user), 2000);
      } else {
        user.status = '抢票失败';
        user.failed = true;
        failedRequests.value++;
        
        setTimeout(() => {          if (!user.success && gameStarted.value && !gameEnded.value && remainingTickets.value > 0) {
            user.status = '等待中';
            user.failed = false;
            user.active = false;
          }
        }, 1000);
      }
    } catch (error) {
      user.status = '网络错误';
      user.failed = true;
      failedRequests.value++;
      
      setTimeout(() => {        if (!user.success && gameStarted.value && !gameEnded.value && remainingTickets.value > 0) {
          user.status = '等待中';
          user.failed = false;
          user.active = false;
        }
      }, 1000);
    }
  }

  // 循环结束后的最终状态
  if (!user.success) {
    user.status = '等待中';
  }
}

// 重置用户状态
const resetUserStatus = (user) => {
  user.status = '等待中'
  user.success = false
  user.failed = false
  user.active = false
}

// 初始化虚拟用户
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

// 开始游戏
const startGame = async () => {
  try {
    // 先设置后端库存
    const stockSet = await setStock("1", ticketCount.value.toString())
    if (!stockSet) {
      statusMessage.value = '❌ 设置库存失败，请重试！'
      return
    }
    
    // 重置游戏状态
    gameStarted.value = true
    gameEnded.value = false
    ticketsGrabbed.value = 0
    remainingTime.value = countdownSeconds.value
    remainingTickets.value = ticketCount.value
    totalRequests.value = 0
    successfulRequests.value = 0
    failedRequests.value = 0
    statusMessage.value = '✅ 库存设置成功！准备开始抢票！'
    userHasTicket.value = false // 重置用户抢票状态
    
    // 初始化虚拟用户
    initVirtualUsers()
    
    // 开始倒计时
    countdownTimer = setInterval(() => {
      remainingTime.value--
      if (remainingTime.value <= 0) {
        // 倒计时结束，开始抢票阶段
        startTicketPhase()
      }
    }, 1000)
  } catch (error) {
    statusMessage.value = '❌ 开始游戏失败，请重试！'
  }
}

// 开始抢票阶段
const startTicketPhase = () => {
  clearInterval(countdownTimer)
  remainingTime.value = 0 // 倒计时结束
  statusMessage.value = '🔥 抢票开始！所有虚拟用户已释放！'
  
  // 释放所有虚拟用户，让他们开始独立行动
  virtualUsers.value.forEach(user => {
    startVirtualUser(user);
  });
  
  // 启动监控，检查是否应该结束游戏
  startGameMonitor()
}

// 游戏监控
const startGameMonitor = () => {
  const monitorInterval = setInterval(() => {
    // 检查是否所有票都被抢完
    if (remainingTickets.value <= 0) {
      clearInterval(monitorInterval)
      endGame()
      return
    }
    
    // 检查是否所有用户都完成了（成功或停止尝试）
    const allUsersFinished = virtualUsers.value.every(user => 
      user.success || user.status === '等待中'
    )
    
    // 如果所有用户都完成了但还有票，游戏结束
    if (allUsersFinished && remainingTickets.value > 0) {
      clearInterval(monitorInterval)
      endGame()
    }
  }, 1000) // 每秒检查一次
}

// 移除重新激活用户的函数
// const reactivateUsers = () => { ... }

// 用户抢票
const userGrabTicket = async () => {
  if (remainingTickets.value <= 0 || remainingTime.value > 0 || userHasTicket.value) return
  
  totalRequests.value++
  
  // 生成用户ID
  const userId = 114514
  
  try {
    // 发送抢票请求
    const result = await grabTicketApi(userId)
    
    if (result.success && remainingTickets.value > 0) {
      ticketsGrabbed.value++
      remainingTickets.value--
      successfulRequests.value++
      statusMessage.value = '🎉 抢票成功！'
      userHasTicket.value = true // 用户抢到票
    } else {
      failedRequests.value++
      statusMessage.value = '😢 抢票失败，继续加油！'
    }
  } catch (error) {
    failedRequests.value++
    statusMessage.value = '😢 网络错误，请重试！'
  }
  
  // 清除状态消息
  setTimeout(() => {
    statusMessage.value = ''
  }, 2000)
}

// 结束游戏
const endGame = async () => {
  clearInterval(countdownTimer)
  gameStarted.value = false
  gameEnded.value = true
  
  try {
    // 清除后端库存
    const stockCleared = await clearStock("1")
    if (stockCleared) {
      statusMessage.value = '✅ 游戏结束，库存已清除'
    } else {
      statusMessage.value = '⚠️ 游戏结束，但清除库存失败'
    }
  } catch (error) {
    statusMessage.value = '⚠️ 游戏结束，但清除库存失败'
  }
}

// 重新开始游戏
const restartGame = () => {
  gameStarted.value = false
  gameEnded.value = false
  ticketsGrabbed.value = 0
  remainingTime.value = 0
  remainingTickets.value = 0
  totalRequests.value = 0
  successfulRequests.value = 0
  failedRequests.value = 0
  statusMessage.value = '游戏已重置，点击"开始抢票！"重新开始'
  userHasTicket.value = false // 重置用户抢票状态
  virtualUsers.value = []
}

// 返回游戏列表
const goBack = () => {
  router.push('/games')
}

// 组件卸载时清理
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  gameStarted.value = false // 确保所有虚拟用户循环停止
})
</script>

<style scoped>
.ticket-rush-game {
  min-height: 100vh;
  width: 100%;
  padding: calc(var(--nav-height, 70px) + 2rem) 2rem 2rem;
  background: radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%);
  box-sizing: border-box;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.game-header {
  text-align: center;
  margin-bottom: 2rem;
}

.game-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 2.5rem;
  font-weight: 900;
  margin-bottom: 1rem;
  background: linear-gradient(to right, #fff, #f3caff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(235, 7, 238, 0.3);
}

.icon {
  font-size: 2.5rem;
  filter: drop-shadow(0 0 10px rgba(235, 7, 238, 0.5));
}

.game-description {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1rem;
  margin: 0;
}

/* Game setup area */
.game-setup {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 2.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 900px;
  width: 100%;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: flex;
  gap: 2rem;
  margin-bottom: 0.6rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.form-group label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
}

.form-group input {
  padding: 0.8rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary, #eb07ee);
  box-shadow: 0 0 0 3px rgba(235, 7, 238, 0.2);
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.form-hint {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 0.1rem;
}

.start-btn {
  background: linear-gradient(135deg, var(--primary, #eb07ee), var(--primary-dark, #a505de));
  color: white;
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  letter-spacing: 1px;
  box-shadow: 0 10px 30px rgba(235, 7, 238, 0.3);
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 15px 40px rgba(235, 7, 238, 0.5);
  filter: brightness(1.1);
}

.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Game playing area */
.game-playing {
  text-align: center;
  padding: 2rem;
  max-width: 900px;
  width: 100%;
}

.countdown-display {
  margin-bottom: 2rem;
}

.countdown-number {
  font-size: 4rem;
  font-weight: bold;
  background: linear-gradient(135deg, #fff, #f3caff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: none;
  filter: drop-shadow(0 0 20px rgba(235, 7, 238, 0.6));
}

.countdown-label {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.5rem;
}

.game-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  padding: 1.5rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.info-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.info-item .label {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.info-item .value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
}

/* Real-time rush status */
.rush-status {
  margin-bottom: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  padding: 1.5rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.rush-status h4 {
  margin: 0 0 1rem 0;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.status-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.status-item .label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.status-item .value {
  font-size: 1.1rem;
  font-weight: bold;
  color: #fff;
}

.status-item .value.success {
  color: #69F0AE;
}

.status-item .value.failed {
  color: #FF5252;
}

/* Virtual users animation */
.virtual-users {
  margin-bottom: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  padding: 1.5rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.virtual-users h4 {
  margin: 0 0 1rem 0;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
}

.users-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(65px, 1fr));
  gap: 0.3rem;
  max-height: 200px;
  overflow-y: auto;
}

.virtual-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.3rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.virtual-user.active {
  border-color: rgba(255, 193, 7, 0.6);
  background: rgba(255, 193, 7, 0.1);
}

.virtual-user.success {
  background: rgba(0, 200, 83, 0.1);
  border: 2px solid rgba(0, 200, 83, 0.3);
}

.virtual-user.failed {
  background: rgba(255, 23, 68, 0.1);
  border: 2px solid rgba(255, 23, 68, 0.3);
}

.user-icon {
  font-size: 0.9rem;
}

.user-id {
  font-size: 0.65rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.8);
}

.user-status {
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  line-height: 1;
}

.more-users {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.3rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 2px dashed rgba(255, 255, 255, 0.2);
}

.more-icon {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.5);
}

.more-text {
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

/* User rush button */
.rush-button-container {
  margin-bottom: 1.5rem;
}

.rush-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
  border: none;
  padding: 1.2rem 2.5rem;
  border-radius: 50px;
  font-size: 1.3rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
  margin-bottom: 0.8rem;
  letter-spacing: 1px;
}

.rush-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 6px 25px rgba(255, 107, 107, 0.4);
}

.rush-btn:active:not(:disabled) {
  transform: scale(0.95);
  box-shadow: 0 2px 10px rgba(255, 107, 107, 0.3);
  transition: all 0.1s ease;
}

.rush-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.rush-btn.success {
  background: linear-gradient(135deg, #00C853 0%, #00E676 100%);
  box-shadow: 0 10px 30px rgba(0, 200, 83, 0.3);
  cursor: default;
}

.rush-btn.success:hover {
  transform: none;
  box-shadow: 0 10px 30px rgba(0, 200, 83, 0.3);
}

.rush-hint {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.status-message {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary-light, #f3caff);
  min-height: 1.5rem;
  text-shadow: 0 0 10px rgba(235, 7, 238, 0.4);
}

/* Game result area */
.game-result {
  text-align: center;
  padding: 3rem 2rem;
  max-width: 700px;
  width: 100%;
}

.result-header h3 {
  color: #fff;
  font-size: 2rem;
  margin-bottom: 2rem;
  font-weight: 800;
  text-shadow: 0 0 20px rgba(235, 7, 238, 0.6);
}

.result-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  padding: 2rem;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.result-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.result-item .label {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.result-item .value {
  font-size: 1.3rem;
  font-weight: bold;
  color: #fff;
}

.result-item .value.success {
  color: #69F0AE;
}

.result-item .value.failed {
  color: #FF5252;
}

.result-message {
  margin-bottom: 2rem;
}

.success-message {
  color: #69F0AE;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 0 15px rgba(0, 200, 83, 0.4);
}

.failed-message {
  color: #FF5252;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 0 15px rgba(255, 23, 68, 0.4);
}

.action-buttons {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.restart-btn, .back-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 1px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.restart-btn {
  background: linear-gradient(135deg, var(--primary, #eb07ee), var(--primary-dark, #a505de));
  color: white;
  box-shadow: 0 10px 30px rgba(235, 7, 238, 0.3);
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.restart-btn:hover, .back-btn:hover {
  transform: translateY(-3px);
}

.restart-btn:hover {
  box-shadow: 0 15px 40px rgba(235, 7, 238, 0.5);
  filter: brightness(1.1);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .ticket-rush-game {
    padding: calc(var(--nav-height, 70px) + 1rem) 1rem 1rem;
  }
  
  .game-title {
    font-size: 2rem;
  }
  
  .countdown-number {
    font-size: 3rem;
  }
  
  .rush-btn {
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }
  
  .game-info, .result-content, .status-grid {
    grid-template-columns: 1fr;
  }
  
  .users-container {
    grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  /* 在小屏幕上，表单行改为垂直排列 */
  .form-row {
    flex-direction: column;
    gap: 0.6rem;
  }
  
  .form-group {
    margin-bottom: 0.4rem;
  }
}
</style>
