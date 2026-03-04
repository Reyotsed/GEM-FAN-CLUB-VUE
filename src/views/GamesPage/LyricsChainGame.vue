<template>
  <div class="lyrics-chain-game">
    <h2 class="section-title">
      <span class="icon">🎵</span>
      歌词接龙
    </h2>
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <template v-else>
      <!-- 添加难度选择界面 -->
      <div v-if="!gameStarted" class="difficulty-selection">
        <h3>选择难度</h3>
        <div class="difficulty-options">
          <button 
            @click="selectDifficulty(1)" 
            class="difficulty-button"
            :class="{ 'selected': selectedDifficulty === 1 }"
          >
            路人难度
            <span class="difficulty-desc">我知道邓紫棋，听过一些她的大火歌曲</span>
          </button>
          <button 
            @click="selectDifficulty(2)" 
            class="difficulty-button"
            :class="{ 'selected': selectedDifficulty === 2 }"
          >
            歌迷难度
            <span class="difficulty-desc">我是邓紫棋的歌迷，对她的歌曲很熟悉</span>
          </button>
        </div>
        <button 
          @click="startGame" 
          class="start-game-button"
          :disabled="!selectedDifficulty"
        >
          开始游戏
        </button>
      </div>
      <template v-else>
        <div v-if="!gameCompleted" class="game-stats">
          <div class="progress-bar">
            <div class="progress" :style="{ width: `${(currentQuestion + 1) * 10}%` }"></div>
          </div>
          <div class="stats-container">
            <div class="stat-item">
              <span class="stat-label">当前进度</span>
              <span class="stat-value">{{ currentQuestion + 1 }}/10</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">得分</span>
              <span class="stat-value">{{ score }}</span>
            </div>
          </div>
        </div>
        <div v-if="gameCompleted" class="game-completed">
          <div class="completion-animation">
            <div class="checkmark">✓</div>
          </div>
          <h3>恭喜完成！</h3>
          <p>总得分: {{ score }}</p>
          <p>完成时间: {{ formatTime(completionTime) }}</p>
          <div class="record-form" v-if="!hasRecorded">
            <input 
              v-model="nickname" 
              placeholder="输入昵称保存记录" 
              class="nickname-input"
              maxlength="10"
            />
            <button @click="saveRecord" class="save-record-button">保存记录</button>
          </div>
          <button @click="restartGame" class="restart-button">再来一次</button>
        </div>
        <template v-else>
          <div class="current-lyric">
            <div class="song-info">
              <span class="song-icon">🎵</span>
              <p class="song-name">{{ currentLyric.song }}</p>
            </div>
          </div>
          <div class="input-area">
            <div class="inputs-container">
              <template v-for="(part, index) in lyricParts" :key="index">
                <span class="lyric-text">{{ part.text }}</span>
                <input 
                  v-if="part.isQuestion"
                  v-model="userInputs[part.inputIndex]"
                  @input="handleInput($event, part.inputIndex)"
                  @keydown="handleKeydown($event, part.inputIndex)"
                  ref="inputRefs"
                  class="lyric-input"
                />
              </template>
            </div>
            <div class="button-group">
              <button @click="submitAnswer" class="submit-button">提交</button>
              <button @click="giveUp" class="give-up-button">放弃</button>
            </div>
          </div>
          <div class="history">
            <h3>答题历史</h3>
            <ul>
              <li v-for="(item, index) in history" :key="index" :class="{ 'correct': item.isCorrect, 'incorrect': !item.isCorrect }">
                <div class="history-item">
                  <div class="history-content">
                    {{ item.lyric }}
                    <span class="result-icon">{{ item.isCorrect ? '✓' : '✗' }}</span>
                  </div>
                  <div v-if="!item.isCorrect" class="correct-answer">
                    正确答案: {{ item.correctAnswer }}
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </template>
        <div v-if="showLeaderboard" class="leaderboard">
          <h3>歌词接龙排行榜</h3>
          <div class="leaderboard-list">
            <div class="leaderboard-header">
              <span class="rank">排名</span>
              <span class="name">昵称</span>
              <span class="difficulty">难度</span>
              <span class="score">得分</span>
              <span class="time">用时</span>
            </div>
            <div v-for="(record, index) in leaderboard" :key="index" class="leaderboard-item">
              <span class="rank">{{ index + 1 }}</span>
              <span class="name">{{ record.nickname }}</span>
              <span class="difficulty">{{ record.diffLevel === 1 ? '普通' : '困难' }}</span>
              <span class="score">{{ record.score }}</span>
              <span class="time">{{ formatTime(record.completionTime) }}</span>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
  <!-- 正确答案弹窗 -->
  <div v-if="showAnswerModal" class="answer-modal">
    <div class="modal-content">
      <h3>正确答案</h3>
      <p class="song-name">歌曲：{{ currentLyric.song }}</p>
      <div class="answer-comparison">
        <div class="answer-item">
          <p class="answer-label">你的答案：</p>
          <p class="user-answer">{{ displayLyric }}</p>
        </div>
        <div class="answer-item">
          <p class="answer-label">正确答案：</p>
          <p class="correct-answer-text">{{ currentLyric.lyric }}</p>
        </div>
      </div>
      <button @click="closeAnswerModal" class="modal-close-button">继续</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import apiClient from '@/utils/api'
import { showToast } from '@/utils/toast'

const currentLyric = ref({})
const userInputs = ref([])
const score = ref(0)
const streak = ref(0)
const history = ref([])
const loading = ref(true)
const error = ref('')
const inputRefs = ref([])
const gameCompleted = ref(false)
const startTime = ref(null)
const completionTime = ref(0)
const currentQuestion = ref(0)
const showAnswerModal = ref(false)
const nickname = ref('')
const hasRecorded = ref(false)
const showLeaderboard = ref(false)
const leaderboard = ref([])
let availableLyrics = []
const gameStarted = ref(false)
const selectedDifficulty = ref(null)

const lyricParts = computed(() => {
  if (!currentLyric.value.guess) return []
  
  const parts = []
  const text = currentLyric.value.guess
  let lastIndex = 0
  let inputIndex = 0
  
  // 分割歌词，将问号部分和普通文本分开
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '？') {
      // 添加问号前的文本
      if (i > lastIndex) {
        parts.push({
          text: text.slice(lastIndex, i),
          isQuestion: false
        })
      }
      // 添加问号部分
      parts.push({
        text: '',
        isQuestion: true,
        inputIndex: inputIndex++
      })
      lastIndex = i + 1
    }
  }
  
  // 添加最后一段文本
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      isQuestion: false
    })
  }
  
  return parts
})

const displayLyric = computed(() => {
  if (!currentLyric.value.guess) return currentLyric.value.lyric
  
  let result = ''
  let inputIndex = 0
  
  for (const part of lyricParts.value) {
    if (part.isQuestion) {
      result += userInputs.value[inputIndex] || '？'
      inputIndex++
    } else {
      result += part.text
    }
  }
  
  return result
})

const handleInput = (event, index) => {
  const value = event.target.value
  if (value.length > 0) {
    // 检查第一个字符是否为中文
    if (/[\u4e00-\u9fa5]/.test(value[0])) {
      // 将多余的字分配到后面的输入框中
      const remainingChars = value.slice(1)
      let currentIndex = index + 1
      
      // 先清空当前输入框，只保留第一个字
      userInputs.value[index] = value[0]
      
      // 将剩余的字分配到后面的输入框中
      for (let i = 0; i < remainingChars.length; i++) {
        // 只处理中文字符
        if (currentIndex < userInputs.value.length && /[\u4e00-\u9fa5]/.test(remainingChars[i])) {
          userInputs.value[currentIndex] = remainingChars[i]
          currentIndex++
        }
      }
      
      // 将焦点移到最后一个被填充的输入框
      nextTick(() => {
        if (currentIndex - 1 < inputRefs.value.length) {
          inputRefs.value[currentIndex - 1].focus()
        }
      })
    } else {
      // 如果不是中文，清空输入
      userInputs.value[index] = ''
    }
  }
}

const handleKeydown = (event, index) => {
  // 处理退格键
  if (event.key === 'Backspace' && !userInputs.value[index]) {
    const prevIndex = index - 1
    if (prevIndex >= 0) {
      nextTick(() => {
        inputRefs.value[prevIndex].focus()
      })
    }
  }
}

const startGame = () => {
  try {
    // 根据选择的难度筛选歌词
    let filteredLyrics = availableLyrics.filter(lyric => lyric.guess)
    if (selectedDifficulty.value === 1) {
      // 只选择难度为1的题目
      filteredLyrics = filteredLyrics.filter(lyric => lyric.level === 1)
    }
    // 难度2包含所有题目，不需要额外过滤

    if (filteredLyrics.length === 0) {
      throw new Error('没有可用的歌词题目')
    }

    // 随机选择10个不重复的题目
    availableLyrics = []
    const usedIndices = new Set()
    
    while (availableLyrics.length < 10 && availableLyrics.length < filteredLyrics.length) {
      const randomIndex = Math.floor(Math.random() * filteredLyrics.length)
      if (!usedIndices.has(randomIndex)) {
        availableLyrics.push(filteredLyrics[randomIndex])
        usedIndices.add(randomIndex)
      }
    }

    // 重置游戏状态
    score.value = 0
    streak.value = 0
    history.value = []
    currentQuestion.value = 0
    gameCompleted.value = false
    startTime.value = Date.now()
    gameStarted.value = true
    
    // 开始第一题
    getNewLyric()
  } catch (err) {
    error.value = '加载游戏数据失败，请稍后重试'
  }
}

const getNewLyric = () => {
  if (currentQuestion.value >= 10) {
    // 游戏结束
    gameCompleted.value = true
    completionTime.value = Date.now() - startTime.value
    showLeaderboard.value = true  // 游戏完成后立即显示排行榜
    loadLeaderboard()  // 加载排行榜数据
    return
  }
  
  currentLyric.value = availableLyrics[currentQuestion.value]
  // 重置输入框
  userInputs.value = Array(lyricParts.value.filter(p => p.isQuestion).length).fill('')
}

const showModal = () => {
  showAnswerModal.value = true
}

const closeAnswerModal = () => {
  showAnswerModal.value = false
  // 进入下一题
  currentQuestion.value++
  getNewLyric()
}

const submitAnswer = () => {
  // 检查是否所有输入框都已填写
  if (userInputs.value.some(input => !input.trim())) {
    return
  }

  const isCorrect = checkAnswer()
  history.value.unshift({
    lyric: displayLyric.value,
    isCorrect,
    correctAnswer: isCorrect ? null : currentLyric.value.lyric
  })

  if (isCorrect) {
    score.value += 10
    // 进入下一题
    currentQuestion.value++
    getNewLyric()
  } else {
    showModal()
  }
}

const giveUp = () => {
  history.value.unshift({
    lyric: displayLyric.value,
    isCorrect: false,
    correctAnswer: currentLyric.value.lyric
  })
  showModal()
}

const restartGame = () => {
  gameStarted.value = false
  selectedDifficulty.value = null
  hasRecorded.value = false
  showLeaderboard.value = false
  nickname.value = ''
}

const formatTime = (ms) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds}秒`
}

const checkAnswer = () => {
  const originalLyric = currentLyric.value.lyric
  return displayLyric.value === originalLyric
}

const saveRecord = async () => {
  if (!nickname.value.trim()) return
  
  const params = {
    nickname: nickname.value,
    score: score.value,
    completionTime: completionTime.value,
    diffLevel: selectedDifficulty.value, // 默认难度级别
    userId: (localStorage.getItem('userId') || '').replace(/"/g, '') // 移除双引号
  }
  try {
    // 发送到后端保存
    const response = await apiClient.post('/game/lyrics-chain/submit-score', null, { params })
    
    if (response.data.code !== 200) {
      throw new Error('保存失败')
    }
    
    hasRecorded.value = true
    // 保存成功后刷新排行榜数据
    loadLeaderboard()
  } catch (err) {
    console.error('保存排行榜失败:', err)
    showToast('保存排行榜失败，请稍后重试', 'error')
  }
}

const loadLeaderboard = async () => {
  try {
    // 从后端获取排行榜数据
    const response = await apiClient.get('/game/lyrics-chain/getLeaderboard')
    if (response.data.code !== 200) {
      throw new Error('获取排行榜失败')
    }
    leaderboard.value = response.data.data
  } catch (err) {
    console.error('加载排行榜失败:', err)
    leaderboard.value = []
  }
}

const selectDifficulty = (level) => {
  selectedDifficulty.value = level
}

// 加载歌词数据
const loadLyrics = async () => {
  try {
    const response = await fetch('/data/lyrics.json')
    const data = await response.json()
    availableLyrics = data.lyrics
    loading.value = false
  } catch (err) {
    error.value = '加载游戏数据失败，请稍后重试'
    loading.value = false
  }
}

onMounted(() => {
  try {
    loadLyrics()
    loadLeaderboard()
  } catch (err) {
    error.value = '加载游戏数据失败，请稍后重试'
    loading.value = false
  }
})
</script>

<style scoped>
.lyrics-chain-game {
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

.section-title {
  text-align: center;
  margin-bottom: 3rem;
  font-size: 2.5rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  position: relative;
  padding-bottom: 1rem;
  letter-spacing: 2px;
  background: linear-gradient(to right, #fff, #f3caff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(235, 7, 238, 0.3);
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 4px;
  background: linear-gradient(90deg, transparent, var(--primary, #eb07ee), transparent);
  border-radius: 2px;
  box-shadow: 0 0 15px rgba(235, 7, 238, 0.8);
}

.icon {
  font-size: 2.5rem;
  filter: drop-shadow(0 0 8px rgba(235, 7, 238, 0.8));
}

.game-stats {
  margin-bottom: 2rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  max-width: 800px;
  width: 100%;
}

.progress-bar {
  height: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 2rem;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, var(--primary, #eb07ee), #FF69B4);
  transition: width 0.5s cubic-bezier(.4,2,.6,1);
  box-shadow: 0 0 15px rgba(235, 7, 238, 0.6);
}

.stats-container {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 2.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 20px;
  min-width: 140px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(235, 7, 238, 0.1);
  border-color: rgba(235, 7, 238, 0.2);
  background: rgba(255, 255, 255, 0.05);
}

.stat-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.5rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #fff, #e0c3fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 1px;
}

.input-area {
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.inputs-container {
  display: block;
  word-break: break-all;
  white-space: normal;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  max-width: 600px;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.lyric-text {
  display: inline-block;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  word-break: break-all;
  line-height: 1.7;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.lyric-input {
  display: inline-block;
  width: 35px;
  height: 35px;
  padding: 0.3rem;
  border: 2px solid rgba(235, 7, 238, 0.3);
  border-radius: 8px;
  text-align: center;
  font-size: 1rem;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  flex-shrink: 0;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.lyric-input:focus {
  border-color: var(--primary, #eb07ee);
  box-shadow: 0 0 0 3px rgba(235, 7, 238, 0.2);
  background: rgba(255, 255, 255, 0.1);
  outline: none;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.submit-button, .give-up-button {
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
  box-shadow: 0 2px 8px rgba(223, 13, 238, 0.13);
  letter-spacing: 1px;
}

.submit-button {
  background: linear-gradient(135deg, var(--primary, #eb07ee), var(--primary-dark, #a505de));
}

.give-up-button {
  background: linear-gradient(135deg, #ff6b6b, #ee5253);
}

.submit-button:hover, .give-up-button:hover {
  filter: brightness(1.1);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 10px 30px rgba(235, 7, 238, 0.3);
}

.submit-button:active, .give-up-button:active {
  filter: brightness(0.98);
  transform: scale(0.98);
}

.history {
  margin-top: 2rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  max-width: 800px;
  width: 100%;
}

.history h3 {
  color: #fff;
  font-size: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
  font-weight: 700;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.history ul {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 1rem;
}

.history ul::-webkit-scrollbar {
  width: 6px;
}
.history ul::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}
.history ul::-webkit-scrollbar-thumb {
  background: rgba(235, 7, 238, 0.3);
  border-radius: 3px;
}

.history li {
  padding: 1.2rem;
  margin-bottom: 1rem;
  border-radius: 16px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  color: rgba(255, 255, 255, 0.9);
  transition: transform 0.2s;
}

.history li:hover {
  transform: translateX(5px);
  background: rgba(255, 255, 255, 0.05);
}

.history li.correct {
  background: rgba(0, 200, 83, 0.05);
  color: #69F0AE;
  border-color: rgba(0, 200, 83, 0.2);
}

.history li.incorrect {
  background: rgba(255, 23, 68, 0.05);
  color: #FF5252;
  border-color: rgba(255, 23, 68, 0.2);
}

.game-completed {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border-radius: 30px;
  margin-top: 2rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  max-width: 600px;
  width: 100%;
}

.completion-animation {
  width: 120px;
  height: 120px;
  margin: 0 auto 2.5rem;
  background: linear-gradient(135deg, var(--primary, #eb07ee), var(--primary-dark, #a505de));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 40px rgba(235, 7, 238, 0.6);
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.checkmark {
  color: white;
  font-size: 4rem;
}

.game-completed h3 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #fff;
  font-weight: 800;
  text-shadow: 0 0 20px rgba(235, 7, 238, 0.6);
}

.game-completed p {
  font-size: 1.3rem;
  margin: 1rem 0;
  color: rgba(255, 255, 255, 0.8);
}

.restart-button {
  margin-top: 3rem;
  padding: 1.2rem 3.5rem;
  font-size: 1.2rem;
  background: linear-gradient(135deg, var(--primary, #eb07ee), var(--primary-dark, #a505de));
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(235, 7, 238, 0.4);
  font-weight: 700;
  letter-spacing: 1px;
  transition: all 0.3s;
}
.restart-button:hover {
  filter: brightness(1.1);
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 15px 40px rgba(235, 7, 238, 0.6);
}
.restart-button:active {
  filter: brightness(0.98);
  transform: scale(0.98);
}

.leaderboard {
  margin-top: 2rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  max-width: 800px;
  width: 100%;
}

.leaderboard h3 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  color: #fff;
  font-weight: 700;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.leaderboard-header {
  display: grid;
  grid-template-columns: 50px 1fr 60px 60px 80px;
  padding: 1rem;
  background: linear-gradient(135deg, var(--primary, #eb07ee), var(--primary-dark, #a505de));
  color: white;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(235, 7, 238, 0.3);
}

.leaderboard-item {
  display: grid;
  grid-template-columns: 50px 1fr 60px 60px 80px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}
.leaderboard-item:hover {
  transform: translateX(5px);
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 20px rgba(235, 7, 238, 0.1);
}

.rank {
  font-weight: bold;
  color: var(--primary, #eb07ee);
  text-align: center;
}

.name {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 1.5rem;
  font-size: 1.1rem;
}

.score {
  color: var(--primary-light, #f3caff);
  font-weight: bold;
  text-align: center;
  font-size: 1.2rem;
}

.difficulty {
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  font-weight: 500;
  padding: 0.4rem 0.8rem;
  border-radius: 12px;
  background: rgba(235, 7, 238, 0.1);
  font-size: 0.95rem;
}

.time {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  text-align: center;
  font-weight: 500;
}

.record-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1.5rem 0;
  align-items: center;
}

.nickname-input {
  padding: 1rem 1.5rem;
  border: 2px solid rgba(235, 7, 238, 0.3);
  border-radius: 16px;
  font-size: 1rem;
  width: 100%;
  max-width: 300px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: border-color 0.2s, box-shadow 0.2s;
  text-align: center;
}
.nickname-input:focus {
  border-color: var(--primary, #eb07ee);
  box-shadow: 0 0 0 3px rgba(235, 7, 238, 0.2);
  background: rgba(255, 255, 255, 0.08);
  outline: none;
}
.nickname-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.save-record-button {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, var(--primary, #eb07ee), var(--primary-dark, #a505de));
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1rem;
  width: 100%;
  max-width: 300px;
  font-weight: 700;
  letter-spacing: 1px;
  box-shadow: 0 10px 30px rgba(235, 7, 238, 0.3);
  transition: all 0.3s;
}
.save-record-button:hover {
  filter: brightness(1.1);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 15px 40px rgba(235, 7, 238, 0.5);
}
.save-record-button:active {
  filter: brightness(0.98);
  transform: scale(0.98);
}

.answer-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: rgba(30, 30, 40, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2.5rem 3rem;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  max-width: 90%;
  width: 400px;
  text-align: center;
  animation: slideUp 0.3s ease;
  color: #fff;
}

.modal-content h3 {
  color: #fff;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.song-name {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
}

.answer-comparison {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1rem 0;
}

.answer-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.answer-label {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.5);
  min-width: 80px;
  font-weight: 500;
}

.user-answer {
  font-size: 1.1rem;
  color: #FF5252;
  flex: 1;
}

.correct-answer-text {
  font-size: 1.1rem;
  color: #69F0AE;
  flex: 1;
}

.modal-close-button {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, var(--primary, #eb07ee), var(--primary-dark, #a505de));
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-top: 1.5rem;
  box-shadow: 0 10px 30px rgba(235, 7, 238, 0.3);
}

.modal-close-button:hover {
  filter: brightness(1.1);
  transform: translateY(-3px);
  box-shadow: 0 15px 40px rgba(235, 7, 238, 0.5);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 480px) {
  .lyrics-chain-game {
    padding: calc(var(--nav-height, 70px) + 1rem) 1rem 1rem;
  }

  .section-title {
    font-size: 2rem;
    margin-bottom: 2rem;
  }

  .game-stats {
    padding: 0.8rem;
  }

  .stat-item {
    padding: 0.6rem 0.8rem;
    min-width: 80px;
  }

  .stat-label {
    font-size: 0.8rem;
  }

  .stat-value {
    font-size: 1.1rem;
  }

  .inputs-container {
    max-width: 100%;
    padding: 0.8rem;
  }

  .lyric-input {
    width: 30px;
    height: 30px;
    font-size: 0.9rem;
  }

  .lyric-text {
    font-size: 0.9rem;
  }

  .button-group {
    gap: 0.8rem;
  }

  .submit-button, .give-up-button {
    padding: 0.7rem 1.2rem;
    font-size: 0.9rem;
    min-width: 90px;
  }

  .history {
    padding: 0.8rem;
  }

  .history h3 {
    font-size: 1.1rem;
  }

  .history li {
    padding: 0.6rem;
    font-size: 0.9rem;
  }

  .leaderboard {
    padding: 0.5rem;
    border-radius: 10px;
  }
  .leaderboard h3 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  .leaderboard-header,
  .leaderboard-item {
    grid-template-columns: 32px 1fr 38px 38px 50px;
    padding: 0.3rem 0.2rem;
    font-size: 0.75rem;
    border-radius: 6px;
    gap: 0.1rem;
  }
  .name {
    font-size: 0.8rem;
    padding: 0 0.3rem;
    max-width: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .score, .difficulty, .time {
    font-size: 0.75rem;
    padding: 0 0.1rem;
  }
  .rank {
    font-size: 0.8rem;
    min-width: 24px;
  }

  .record-form {
    margin: 1rem 0;
  }

  .nickname-input,
  .save-record-button {
    padding: 0.7rem 0.8rem;
    font-size: 0.9rem;
  }

  .modal-content {
    padding: 1rem;
    width: 90%;
  }

  .modal-content h3 {
    font-size: 1.2rem;
  }

  .song-name {
    font-size: 1rem;
  }

  .answer-item {
    padding: 0.6rem;
  }
  
  .answer-label {
    font-size: 0.9rem;
    min-width: 70px;
  }
  
  .user-answer,
  .correct-answer-text {
    font-size: 1rem;
  }

  .modal-close-button {
    padding: 0.7rem 1.2rem;
    font-size: 0.9rem;
  }
}

.answer-item {
  background: rgba(255, 255, 255, 0.05);
}

/* Difficulty selection */
.difficulty-selection {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border-radius: 30px;
  margin: 2rem auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  max-width: 900px;
  width: 100%;
}

.difficulty-selection h3 {
  font-size: 2.5rem;
  color: #fff;
  margin-bottom: 3rem;
  font-weight: 800;
  text-shadow: 0 0 20px rgba(235, 7, 238, 0.6);
}

.difficulty-options {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.difficulty-button {
  padding: 2.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 260px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  color: #fff;
  font-size: 1.4rem;
  font-weight: 700;
}

.difficulty-button:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(235, 7, 238, 0.2);
  border-color: rgba(235, 7, 238, 0.5);
  background: rgba(255, 255, 255, 0.08);
}

.difficulty-button.selected {
  background: linear-gradient(135deg, rgba(235, 7, 238, 0.2), rgba(165, 5, 222, 0.2));
  color: #fff;
  border-color: var(--primary, #eb07ee);
  box-shadow: 0 0 30px rgba(235, 7, 238, 0.4);
}

.difficulty-desc {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 1.2rem;
  font-weight: 400;
  line-height: 1.6;
  max-width: 200px;
}

.difficulty-button.selected .difficulty-desc {
  color: rgba(255, 255, 255, 0.9);
}

.start-game-button {
  padding: 1.2rem 4rem;
  font-size: 1.4rem;
  background: linear-gradient(135deg, var(--primary, #eb07ee), var(--primary-dark, #a505de));
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 700;
  letter-spacing: 2px;
  box-shadow: 0 10px 30px rgba(235, 7, 238, 0.4);
  transition: all 0.3s;
  text-transform: uppercase;
}

.start-game-button:hover:not(:disabled) {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 15px 40px rgba(235, 7, 238, 0.6);
  filter: brightness(1.1);
}

.start-game-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@media (max-width: 480px) {
  .difficulty-selection {
    padding: 1.5rem;
  }

  .difficulty-options {
    flex-direction: column;
    gap: 1rem;
  }

  .difficulty-button {
    padding: 1.2rem 1.5rem;
    min-width: auto;
  }

  .start-game-button {
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
  }
}

.song-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  animation: fadeIn 0.5s ease;
}

.song-icon {
  font-size: 2rem;
  color: var(--primary, #eb07ee);
  animation: pulse 2s infinite;
  filter: drop-shadow(0 0 10px rgba(235, 7, 238, 0.6));
}

.song-name {
  font-size: 1.4rem;
  color: #fff;
  font-weight: 700;
  letter-spacing: 1px;
  margin: 0;
  text-align: center;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@media (max-width: 480px) {
  .song-info {
    padding: 0.8rem;
    margin-bottom: 1rem;
  }
  
  .song-icon {
    font-size: 1.3rem;
  }
  
  .song-name {
    font-size: 1.1rem;
  }
}
</style> 