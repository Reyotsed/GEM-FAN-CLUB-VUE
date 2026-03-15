<template>
  <div class="guess-song-game">
    <h2 class="section-title">
      <span class="icon">🎵</span>
      猜歌名
    </h2>
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <template v-else>
      <!-- 难度选择界面 -->
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
          <div class="current-song">
            <div class="song-info">
              <span class="song-icon">🎵</span>
              <p class="song-name">正在播放...</p>
            </div>
            <AudioPlayer v-if="currentSong.realAudioUrl" :src="currentSong.realAudioUrl" />
          </div>
          <div class="options-container">
            <button 
              v-for="(option, index) in currentOptions" 
              :key="index"
              @click="selectAnswer(option)"
              class="option-button"
              :class="{ 
                'selected': selectedAnswer === option,
                'correct': showResult && option === currentSong.title,
                'wrong': showResult && selectedAnswer === option && option !== currentSong.title
              }"
              :disabled="showResult"
            >
              {{ option }}
            </button>
          </div>
          <div class="button-group">
            <button 
              @click="submitAnswer" 
              class="submit-button"
              :disabled="!selectedAnswer || showResult"
            >
              提交
            </button>
            <button 
              @click="nextQuestion" 
              class="next-button"
              v-if="showResult"
            >
              下一题
            </button>
          </div>
          <div class="history">
            <h3>答题历史</h3>
            <ul>
              <li v-for="(item, index) in history" :key="index" :class="{ 'correct': item.isCorrect, 'incorrect': !item.isCorrect }">
                <div class="history-item">
                  <div class="history-content">
                    {{ item.song }}
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
          <h3>听歌识曲排行榜</h3>
          <div class="leaderboard-list">
            <div class="leaderboard-header">
              <span class="rank">排名</span>
              <span class="name">昵称</span>
              <span class="difficulty">难度</span>
              <span class="leaderboard-score">得分</span>
              <span class="time">用时</span>
            </div>
            <div v-for="(record, index) in leaderboard" :key="index" class="leaderboard-item">
              <span class="rank">{{ index + 1 }}</span>
              <span class="name">{{ record.nickname }}</span>
              <span class="difficulty">{{ record.diffLevel === 1 ? '路人' : '歌迷' }}</span>
              <span class="leaderboard-score">{{ record.score }}</span>
              <span class="time">{{ formatTime(record.completionTime) }}</span>
            </div>
            <div v-if="leaderboard.length === 0" class="leaderboard-empty">
              暂无排行记录，快来成为第一名吧！
            </div>
          </div>
        </div>
      </template>
    </template>
    <div v-if="showAnswerModal" class="answer-modal">
      <div class="modal-content">
        <div class="answer-result-row">
          <span v-if="answerResult === 'correct'" class="result-icon correct">✔</span>
          <span v-else class="result-icon wrong">✗</span>
          <span :class="['result-title', answerResult]">
            {{ answerResult === 'correct' ? '回答正确！' : '回答错误' }}
          </span>
        </div>
        <p class="song-name">正确答案：{{ answerSong.title }}</p>
        <div class="modal-link-row">
          <a
            class="wyy-link"
            :href="'https://music.163.com/#/song?id=' + answerSong.wyyId"
            target="_blank"
            rel="noopener"
          >
            去网易云听这首歌
          </a>
        </div>
        <p v-if="answerSong.discirbe" class="song-desc">{{ answerSong.discirbe }}</p>
        <div class="modal-btn-row">
          <button @click="closeAnswerModal" class="modal-close-button">继续</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import apiClient from '@/utils/api'
import AudioPlayer from '@/components/audio/AudioPlayer.vue'
import { showToast } from '@/utils/toast'
import { trackEvent, EVENTS } from '@/utils/stats'

const songs = ref([])
const loading = ref(false)
const error = ref(null)
const gameStarted = ref(false)
const selectedDifficulty = ref(null)
const currentQuestion = ref(0)
const score = ref(0)
const history = ref([])
const gameCompleted = ref(false)
const startTime = ref(null)
const completionTime = ref(0)
const currentSong = ref({})
const currentOptions = ref([])
const selectedAnswer = ref(null)
const showResult = ref(false)

// 新增弹窗相关变量
const showAnswerModal = ref(false)
const answerResult = ref('') // 'correct' or 'wrong'
const answerSong = ref({})

// 排行榜相关变量
const nickname = ref('')
const hasRecorded = ref(false)
const showLeaderboard = ref(false)
const leaderboard = ref([])

const selectDifficulty = (level) => {
  selectedDifficulty.value = level
}

const startGame = async () => {
  try {
    loading.value = true
    error.value = null
    const response = await apiClient.get('/game/song/random', {
      params: { maxLevel: selectedDifficulty.value }
    })
    if (response.data.code === 200) {
      const songList = response.data.data
      // 获取每首歌的真实音频链接
      for (const song of songList) {
        if (song.audioUrl) {
          song.realAudioUrl = await apiClient.getImageUrl(song.audioUrl)
        } else {
          song.realAudioUrl = ''
        }
      }
      songs.value = songList
      gameStarted.value = true
      startTime.value = Date.now()
      trackEvent(EVENTS.GAME_START_GUESS_SONG)
      getNewQuestion()
    } else {
      error.value = response.data.message || '获取失败'
    }
  } catch (e) {
    error.value = e.message || '网络错误'
  } finally {
    loading.value = false
  }
}

const getNewQuestion = () => {
  if (currentQuestion.value >= 10) {
    gameCompleted.value = true
    completionTime.value = Date.now() - startTime.value
    showLeaderboard.value = true
    loadLeaderboard()
    trackEvent(EVENTS.GAME_COMPLETE_GUESS_SONG)
    return
  }

  currentSong.value = songs.value[currentQuestion.value]
  // 生成选项
  const options = [currentSong.value.title]
  const otherSongs = songs.value.filter(s => s.title !== currentSong.value.title)
  while (options.length < 4 && otherSongs.length > 0) {
    const randomIndex = Math.floor(Math.random() * otherSongs.length)
    const randomSong = otherSongs[randomIndex]
    if (!options.includes(randomSong.title)) {
      options.push(randomSong.title)
    }
    otherSongs.splice(randomIndex, 1)
  }
  // 打乱选项顺序
  currentOptions.value = options.sort(() => Math.random() - 0.5)
  selectedAnswer.value = null
  showResult.value = false
}

const selectAnswer = (answer) => {
  if (!showResult.value) {
    selectedAnswer.value = answer
  }
}

const submitAnswer = () => {
  if (!selectedAnswer.value) return
  
  const isCorrect = selectedAnswer.value === currentSong.value.title
  history.value.unshift({
    song: currentSong.value.title,
    isCorrect,
    correctAnswer: currentSong.value.title
  })

  answerResult.value = isCorrect ? 'correct' : 'wrong'
  answerSong.value = { ...currentSong.value }
  showAnswerModal.value = true

  if (isCorrect) {
    score.value += 10
  }
  showResult.value = true
}

const nextQuestion = () => {
  currentQuestion.value++
  getNewQuestion()
}

const handleAudioEnded = () => {
  // 音频播放结束后的处理
}

const restartGame = () => {
  gameStarted.value = false
  selectedDifficulty.value = null
  currentQuestion.value = 0
  score.value = 0
  history.value = []
  gameCompleted.value = false
  selectedAnswer.value = null
  showResult.value = false
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

// 关闭弹窗并进入下一题
const closeAnswerModal = () => {
  showAnswerModal.value = false
}

const saveRecord = async () => {
  if (!nickname.value.trim()) return

  const params = {
    nickname: nickname.value,
    score: score.value,
    completionTime: completionTime.value,
    diffLevel: selectedDifficulty.value,
    userId: (localStorage.getItem('userId') || '').replace(/"/g, '')
  }
  try {
    const response = await apiClient.post('/game/guess-song/submit-score', null, { params })

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
    const response = await apiClient.get('/game/guess-song/getLeaderboard')
    if (response.data.code !== 200) {
      throw new Error('获取排行榜失败')
    }
    leaderboard.value = response.data.data
  } catch (err) {
    console.error('加载排行榜失败:', err)
    leaderboard.value = []
  }
}
</script>

<style scoped>
.guess-song-game {
  padding: calc(var(--nav-height, 70px) + 2rem) 2rem 2rem;
  background: radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%);
  min-height: 100vh;
  color: #fff;
  box-sizing: border-box;
}

.section-title {
  text-align: center;
  margin-bottom: 3rem;
  color: #fff;
  font-size: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  position: relative;
  padding-bottom: 1rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(185, 128, 255, 0.5), 0 0 20px rgba(185, 128, 255, 0.3);
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 4px;
  background: linear-gradient(90deg, transparent, #B980FF, transparent);
  border-radius: 2px;
  box-shadow: 0 0 15px rgba(185, 128, 255, 0.8);
}

.icon {
  font-size: 2.5rem;
  filter: drop-shadow(0 0 8px rgba(185, 128, 255, 0.8));
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
  margin-left: auto;
  margin-right: auto;
}

.progress-bar {
  height: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 2rem;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #B980FF, #FF69B4);
  transition: width 0.5s cubic-bezier(.4,2,.6,1);
  box-shadow: 0 0 15px rgba(185, 128, 255, 0.6);
  position: relative;
}

.progress::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transform: translateX(-100%);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  100% { transform: translateX(100%); }
}

.stats-container {
  display: flex;
  justify-content: center;
  gap: 3rem;
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
  box-shadow: 0 10px 30px rgba(185, 128, 255, 0.1);
  border-color: rgba(185, 128, 255, 0.2);
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
  text-shadow: 0 2px 15px rgba(185, 128, 255, 0.2);
}

.current-song {
  margin: 2rem auto;
  padding: 2.5rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  max-width: 800px;
}

.song-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.song-icon {
  font-size: 2.5rem;
  color: #B980FF;
  animation: pulse 2s infinite;
  filter: drop-shadow(0 0 10px rgba(185, 128, 255, 0.6));
}

.song-name {
  font-size: 1.6rem;
  color: #fff;
  font-weight: 700;
  letter-spacing: 1px;
  margin: 0;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
}

.options-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin: 2rem auto;
  max-width: 800px;
}

.option-button {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  font-weight: 500;
}

.option-button:hover:not(:disabled) {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(185, 128, 255, 0.15);
  border-color: rgba(185, 128, 255, 0.4);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.option-button.selected {
  background: linear-gradient(135deg, rgba(185, 128, 255, 0.2), rgba(138, 43, 226, 0.2));
  color: #fff;
  border-color: #B980FF;
  box-shadow: 0 0 20px rgba(185, 128, 255, 0.3);
}

.option-button.correct {
  background: linear-gradient(135deg, rgba(0, 200, 83, 0.2), rgba(100, 221, 23, 0.2));
  color: #fff;
  border-color: #00E676;
  box-shadow: 0 0 20px rgba(0, 230, 118, 0.3);
}

.option-button.wrong {
  background: linear-gradient(135deg, rgba(255, 23, 68, 0.2), rgba(213, 0, 0, 0.2));
  color: #fff;
  border-color: #FF1744;
  box-shadow: 0 0 20px rgba(255, 23, 68, 0.3);
}

.option-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 3rem 0;
}

.submit-button, .next-button {
  padding: 1rem 3rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 160px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.submit-button {
  background: linear-gradient(135deg, #B980FF, #8A2BE2);
}

.next-button {
  background: linear-gradient(135deg, #00C853, #64DD17);
}

.submit-button:hover:not(:disabled), .next-button:hover {
  filter: brightness(1.1);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.history {
  margin-top: 3rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.history h3 {
  color: #fff;
  font-size: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
  font-weight: 700;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.history ul {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 1rem;
}

/* 自定义滚动条 */
.history ul::-webkit-scrollbar {
  width: 6px;
}
.history ul::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}
.history ul::-webkit-scrollbar-thumb {
  background: rgba(185, 128, 255, 0.3);
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
  margin-left: auto;
  margin-right: auto;
}

.completion-animation {
  width: 120px;
  height: 120px;
  margin: 0 auto 2.5rem;
  background: linear-gradient(135deg, #B980FF, #8A2BE2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 40px rgba(185, 128, 255, 0.6);
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
  text-shadow: 0 0 20px rgba(185, 128, 255, 0.6);
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
  background: linear-gradient(135deg, #B980FF, #8A2BE2);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(185, 128, 255, 0.4);
  font-weight: 700;
  letter-spacing: 1px;
  transition: all 0.3s;
  text-transform: uppercase;
}

.restart-button:hover {
  filter: brightness(1.1);
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 15px 40px rgba(185, 128, 255, 0.6);
}

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
}

.difficulty-selection h3 {
  font-size: 2.5rem;
  color: #fff;
  margin-bottom: 3rem;
  font-weight: 800;
  text-shadow: 0 0 20px rgba(185, 128, 255, 0.6);
}

.difficulty-options {
  display: flex;
  justify-content: center;
  gap: 2.5rem;
  margin-bottom: 4rem;
  flex-wrap: wrap;
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
  box-shadow: 0 20px 40px rgba(185, 128, 255, 0.2);
  border-color: rgba(185, 128, 255, 0.5);
  background: rgba(255, 255, 255, 0.08);
}

.difficulty-button.selected {
  background: linear-gradient(135deg, rgba(185, 128, 255, 0.2), rgba(138, 43, 226, 0.2));
  color: #fff;
  border-color: #B980FF;
  box-shadow: 0 0 30px rgba(185, 128, 255, 0.4);
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
  background: linear-gradient(135deg, #B980FF, #8A2BE2);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 700;
  letter-spacing: 2px;
  box-shadow: 0 10px 30px rgba(185, 128, 255, 0.4);
  transition: all 0.3s;
  text-transform: uppercase;
}

.start-game-button:hover:not(:disabled) {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 15px 40px rgba(185, 128, 255, 0.6);
  filter: brightness(1.1);
}

.start-game-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@media (max-width: 768px) {
  .guess-song-game {
    padding: calc(var(--nav-height, 70px) + 1rem) 1rem 1rem;
  }

  .section-title {
    font-size: 2rem;
    margin-bottom: 2rem;
  }

  .game-stats {
    padding: 1.5rem;
  }

  .stat-item {
    padding: 1rem;
    min-width: 100px;
  }

  .stat-label {
    font-size: 0.8rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .options-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .option-button {
    padding: 1.2rem;
    font-size: 1rem;
  }

  .button-group {
    gap: 1rem;
    flex-direction: column;
    align-items: center;
  }

  .submit-button, .next-button {
    width: 100%;
    padding: 1rem;
  }

  .difficulty-options {
    flex-direction: column;
    gap: 1.5rem;
  }

  .difficulty-button {
    padding: 1.5rem;
    min-width: auto;
    width: 100%;
  }

  .start-game-button {
    width: 100%;
    padding: 1rem;
    font-size: 1.2rem;
  }
}

.answer-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(5px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.modal-content {
  background: #2a1f3d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 2.5rem 3rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  text-align: center;
  min-width: 300px;
  color: #fff;
}
.wyy-link {
  display: inline-block;
  margin: 1.5rem 0;
  color: #B980FF;
  font-weight: bold;
  text-decoration: none;
  font-size: 1.1rem;
  border-bottom: 1px dashed #B980FF;
  transition: all 0.3s;
}
.wyy-link:hover {
  color: #fff;
  border-bottom-style: solid;
}
.song-desc {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}
.modal-close-button {
  margin-top: 1.5rem;
  padding: 0.8rem 2rem;
  background: linear-gradient(135deg, #B980FF, #8A2BE2);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(185, 128, 255, 0.3);
  transition: all 0.3s;
}
.modal-close-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(185, 128, 255, 0.5);
}
.modal-link-row {
  width: 100%;
  margin: 1rem 0 0.5rem 0;
  display: flex;
  justify-content: center;
}
.modal-btn-row {
  width: 100%;
  margin-top: 1.2rem;
  display: flex;
  justify-content: center;
}
.answer-result-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.result-icon {
  font-size: 3rem;
  font-weight: bold;
  display: inline-block;
  vertical-align: middle;
  line-height: 1;
}
.result-icon.correct {
  color: #00E676;
  text-shadow: 0 0 20px rgba(0, 230, 118, 0.5);
}
.result-icon.wrong {
  color: #FF1744;
  text-shadow: 0 0 20px rgba(255, 23, 68, 0.5);
}
.result-title {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 2px;
  display: inline-block;
  vertical-align: middle;
  background: linear-gradient(90deg, #00E676, #69F0AE);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.result-title.wrong {
  background: linear-gradient(90deg, #FF1744, #FF5252);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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
  border: 2px solid rgba(185, 128, 255, 0.3);
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
  border-color: #B980FF;
  box-shadow: 0 0 0 3px rgba(185, 128, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  outline: none;
}
.nickname-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.save-record-button {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #B980FF, #8A2BE2);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1rem;
  width: 100%;
  max-width: 300px;
  font-weight: 700;
  letter-spacing: 1px;
  box-shadow: 0 10px 30px rgba(185, 128, 255, 0.3);
  transition: all 0.3s;
}
.save-record-button:hover {
  filter: brightness(1.1);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 15px 40px rgba(185, 128, 255, 0.5);
}
.save-record-button:active {
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
  margin-left: auto;
  margin-right: auto;
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
  background: linear-gradient(135deg, #B980FF, #8A2BE2);
  color: white;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(185, 128, 255, 0.3);
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
  box-shadow: 0 4px 20px rgba(185, 128, 255, 0.1);
}

.rank {
  font-weight: bold;
  color: #B980FF;
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

.leaderboard-score {
  color: #e0c3fc;
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
  background: rgba(185, 128, 255, 0.1);
  font-size: 0.95rem;
}

.time {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  text-align: center;
  font-weight: 500;
}

.leaderboard-empty {
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1rem;
}

@media (max-width: 768px) {
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
  .leaderboard-score, .difficulty, .time {
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
}
</style>