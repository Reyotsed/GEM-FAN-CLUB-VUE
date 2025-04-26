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
          <p v-if="currentLyric.song" class="song-name">歌曲：{{ currentLyric.song }}</p>
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
import lyricsData from '@/../public/data/lyrics.json'
import apiClient from '@/utils/api'

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
    // 获取所有有guess字段的歌词
    const allLyrics = lyricsData.lyrics.filter(lyric => lyric.guess)
    if (allLyrics.length === 0) {
      throw new Error('没有可用的歌词题目')
    }

    // 随机选择10个不重复的题目
    availableLyrics = []
    const usedIndices = new Set()
    
    while (availableLyrics.length < 10 && availableLyrics.length < allLyrics.length) {
      const randomIndex = Math.floor(Math.random() * allLyrics.length)
      if (!usedIndices.has(randomIndex)) {
        availableLyrics.push(allLyrics[randomIndex])
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
  startGame()
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
    diffLevel: 1, // 默认难度级别
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
    alert('保存排行榜失败，请稍后重试')
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

onMounted(() => {
  try {
    startGame()
    loadLeaderboard()
    loading.value = false
  } catch (err) {
    error.value = '加载游戏数据失败，请稍后重试'
    loading.value = false
  }
})
</script>

<style scoped>
.lyrics-chain-game {
  padding: 1rem;
  background: linear-gradient(135deg, #fff0fa 0%, #f3e6ff 100%);
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(223, 13, 238, 0.10), 0 1.5px 8px rgba(165, 5, 222, 0.08);
  margin-bottom: 1rem;
  border: 1.5px solid #f3caff;
}

.section-title {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #a505de;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
  padding-bottom: 1rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(to right, #df0dee, #a505de);
  border-radius: 3px;
  opacity: 0.7;
}

.icon {
  font-size: 1.5rem;
  color: #df0dee;
}

.game-stats {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #fbefff 0%, #f3e6ff 100%);
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(223, 13, 238, 0.07);
  border: 1px solid #f3caff;
}

.progress-bar {
  height: 8px;
  background: #f8e6ff;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
  box-shadow: 0 1px 4px rgba(223, 13, 238, 0.08) inset;
}

.progress {
  height: 100%;
  background: linear-gradient(to right, #df0dee, #a505de);
  transition: width 0.5s cubic-bezier(.4,2,.6,1);
  box-shadow: 0 2px 8px rgba(223, 13, 238, 0.18);
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
  padding: 0.8rem 1rem;
  background: #fff6fd;
  border-radius: 12px;
  min-width: 100px;
  box-shadow: 0 2px 8px rgba(223, 13, 238, 0.07);
  border: 1px solid #f3caff;
  transition: box-shadow 0.2s;
}

.stat-item:hover {
  box-shadow: 0 4px 16px rgba(223, 13, 238, 0.13);
}

.stat-label {
  font-size: 0.9rem;
  color: #b47adf;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: bold;
  background: linear-gradient(135deg, #df0dee, #a505de);
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
  padding: 1rem;
  background: linear-gradient(135deg, #fbefff 0%, #f3e6ff 100%);
  border-radius: 14px;
  max-width: 500px;
  margin-bottom: 1.5rem;
  border: 1px solid #f3caff;
  box-shadow: 0 2px 10px rgba(223, 13, 238, 0.07);
}

.lyric-text {
  display: inline-block;
  font-size: 1rem;
  color: #7a3fa7;
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
  border: 2px solid #f3caff;
  border-radius: 8px;
  text-align: center;
  font-size: 1rem;
  transition: all 0.2s;
  background: #fff6fd;
  flex-shrink: 0;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 1px 4px rgba(223, 13, 238, 0.08);
}

.lyric-input:focus {
  border-color: #df0dee;
  box-shadow: 0 0 0 3px #f3caff88;
  background: #fff0fa;
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
  background: linear-gradient(135deg, #df0dee, #a505de);
}

.give-up-button {
  background: linear-gradient(135deg, #ff6b6b, #ee5253);
}

.submit-button:hover, .give-up-button:hover {
  filter: brightness(1.08) saturate(1.2);
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 4px 16px rgba(223, 13, 238, 0.18);
}

.submit-button:active, .give-up-button:active {
  filter: brightness(0.98);
  transform: scale(0.98);
}

.history {
  margin-top: 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #fff0fa 0%, #f3e6ff 100%);
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(223, 13, 238, 0.07);
  border: 1px solid #f3caff;
}

.history h3 {
  color: #a505de;
  font-size: 1.2rem;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 700;
  letter-spacing: 1px;
}

.history ul {
  max-height: 200px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.history li {
  padding: 0.8rem;
  margin-bottom: 0.8rem;
  border-radius: 8px;
  font-size: 1rem;
  background: #fff6fd;
  border: 1px solid #f3caff;
  box-shadow: 0 1px 4px rgba(223, 13, 238, 0.06);
}

.history li.correct {
  background: linear-gradient(90deg, #e0ffe7 0%, #f3fff6 100%);
  color: #2e7d32;
  border: 1px solid #b2f5c2;
}

.history li.incorrect {
  background: linear-gradient(90deg, #ffe0e0 0%, #fff3f3 100%);
  color: #c62828;
  border: 1px solid #ffc2c2;
}

.game-completed {
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #fff0fa 0%, #f3e6ff 100%);
  border-radius: 16px;
  margin-top: 1.5rem;
  box-shadow: 0 2px 10px rgba(223, 13, 238, 0.07);
  border: 1px solid #f3caff;
}

.completion-animation {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #df0dee, #a505de);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(223, 13, 238, 0.18);
}

.checkmark {
  color: white;
  font-size: 2.5rem;
}

.game-completed h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #a505de;
  font-weight: 700;
}

.game-completed p {
  font-size: 1.1rem;
  margin: 0.5rem 0;
  color: #7a3fa7;
}

.restart-button {
  margin-top: 1.5rem;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  background: linear-gradient(135deg, #df0dee, #a505de);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(223, 13, 238, 0.13);
  font-weight: 600;
  letter-spacing: 1px;
  transition: all 0.2s;
}
.restart-button:hover {
  filter: brightness(1.08) saturate(1.2);
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 4px 16px rgba(223, 13, 238, 0.18);
}
.restart-button:active {
  filter: brightness(0.98);
  transform: scale(0.98);
}

.leaderboard {
  margin-top: 1.5rem;
  background: linear-gradient(135deg, #fff0fa 0%, #f3e6ff 100%);
  border-radius: 14px;
  padding: 1rem;
  box-shadow: 0 2px 10px rgba(223, 13, 238, 0.07);
  border: 1px solid #f3caff;
}

.leaderboard h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  text-align: center;
  color: #a505de;
  font-weight: 700;
  letter-spacing: 1px;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.leaderboard-header {
  display: grid;
  grid-template-columns: 50px 1fr 60px 60px 80px;
  padding: 0.8rem;
  background: linear-gradient(135deg, #df0dee, #a505de);
  color: white;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(223, 13, 238, 0.13);
}

.leaderboard-item {
  display: grid;
  grid-template-columns: 50px 1fr 60px 60px 80px;
  padding: 0.8rem;
  background: #fff6fd;
  border-radius: 8px;
  font-size: 0.9rem;
  border: 1px solid #f3caff;
  box-shadow: 0 1px 4px rgba(223, 13, 238, 0.06);
  transition: box-shadow 0.2s;
}
.leaderboard-item:hover {
  box-shadow: 0 4px 16px rgba(223, 13, 238, 0.13);
}

.rank {
  font-weight: bold;
  color: #a505de;
  text-align: center;
}

.name {
  color: #7a3fa7;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 1.5rem;
  font-size: 1.1rem;
}

.score {
  color: #df0dee;
  font-weight: bold;
  text-align: center;
  font-size: 1.2rem;
}

.difficulty {
  color: #b47adf;
  text-align: center;
  font-weight: 500;
  padding: 0.4rem 0.8rem;
  border-radius: 12px;
  background: rgba(223, 13, 238, 0.08);
  font-size: 0.95rem;
}

.time {
  color: #7a3fa7;
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
  padding: 0.8rem 1rem;
  border: 2px solid #f3caff;
  border-radius: 12px;
  font-size: 1rem;
  width: 100%;
  max-width: 300px;
  background: #fff6fd;
  box-shadow: 0 1px 4px rgba(223, 13, 238, 0.06);
  transition: border-color 0.2s, box-shadow 0.2s;
  text-align: center;
}
.nickname-input:focus {
  border-color: #df0dee;
  box-shadow: 0 0 0 3px #f3caff88;
  background: #fff0fa;
  outline: none;
}

.save-record-button {
  padding: 0.8rem 1.5rem;
  background: linear-gradient(135deg, #df0dee, #a505de);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  width: 100%;
  max-width: 300px;
  font-weight: 600;
  letter-spacing: 1px;
  box-shadow: 0 2px 8px rgba(223, 13, 238, 0.13);
  transition: all 0.2s;
}
.save-record-button:hover {
  filter: brightness(1.08) saturate(1.2);
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 4px 16px rgba(223, 13, 238, 0.18);
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
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 90%;
  width: 400px;
  text-align: center;
  animation: slideUp 0.3s ease;
}

.modal-content h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.song-name {
  font-size: 1.1rem;
  color: #666;
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
  flex-direction: column;
  gap: 0.5rem;
}

.answer-label {
  font-size: 1rem;
  color: #666;
}

.user-answer {
  font-size: 1.1rem;
  color: #f44336;
  padding: 0.8rem;
  background: rgba(244, 67, 54, 0.1);
  border-radius: 8px;
}

.correct-answer-text {
  font-size: 1.1rem;
  color: #2e7d32;
  padding: 0.8rem;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 8px;
}

.modal-close-button {
  padding: 0.8rem 1.5rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.modal-close-button:hover {
  background: #45a049;
  transform: translateY(-2px);
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
    padding: 0.8rem;
  }

  .section-title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
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

  .user-answer,
  .correct-answer-text {
    font-size: 1rem;
    padding: 0.6rem;
  }

  .modal-close-button {
    padding: 0.7rem 1.2rem;
    font-size: 0.9rem;
  }
}
</style> 