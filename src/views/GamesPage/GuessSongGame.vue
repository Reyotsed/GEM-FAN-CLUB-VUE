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
</script>

<style scoped>
.guess-song-game {
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

.current-song {
  margin: 1.5rem 0;
  padding: 1rem;
  background: linear-gradient(135deg, #fff0fa 0%, #f3e6ff 100%);
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(223, 13, 238, 0.07);
  border: 1px solid #f3caff;
}

.song-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.song-icon {
  font-size: 1.5rem;
  color: #df0dee;
  animation: pulse 2s infinite;
}

.song-name {
  font-size: 1.2rem;
  color: #7a3fa7;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin: 0;
}

.options-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
}

.option-button {
  padding: 1rem;
  background: #fff6fd;
  border: 2px solid #f3caff;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
  color: #7a3fa7;
  text-align: left;
  box-shadow: 0 2px 8px rgba(223, 13, 238, 0.07);
}

.option-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(223, 13, 238, 0.13);
  border-color: #df0dee;
}

.option-button.selected {
  background: linear-gradient(135deg, #df0dee, #a505de);
  color: white;
  border-color: #df0dee;
}

.option-button.correct {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border-color: #4CAF50;
}

.option-button.wrong {
  background: linear-gradient(135deg, #f44336, #e53935);
  color: white;
  border-color: #f44336;
}

.option-button:disabled {
  cursor: not-allowed;
  opacity: 0.8;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin: 1.5rem 0;
}

.submit-button, .next-button {
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

.next-button {
  background: linear-gradient(135deg, #4CAF50, #45a049);
}

.submit-button:hover:not(:disabled), .next-button:hover {
  filter: brightness(1.08) saturate(1.2);
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 4px 16px rgba(223, 13, 238, 0.18);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.difficulty-selection {
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #fff0fa 0%, #f3e6ff 100%);
  border-radius: 16px;
  margin: 1rem 0;
  box-shadow: 0 2px 10px rgba(223, 13, 238, 0.07);
  border: 1px solid #f3caff;
}

.difficulty-selection h3 {
  font-size: 1.5rem;
  color: #a505de;
  margin-bottom: 1.5rem;
  font-weight: 700;
}

.difficulty-options {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.difficulty-button {
  padding: 1.5rem 2rem;
  background: #fff6fd;
  border: 2px solid #f3caff;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 180px;
  box-shadow: 0 2px 8px rgba(223, 13, 238, 0.07);
}

.difficulty-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(223, 13, 238, 0.13);
  border-color: #df0dee;
}

.difficulty-button.selected {
  background: linear-gradient(135deg, #df0dee, #a505de);
  color: white;
  border-color: #df0dee;
}

.difficulty-desc {
  font-size: 0.9rem;
  color: #7a3fa7;
  margin-top: 0.5rem;
  font-weight: 500;
}

.difficulty-button.selected .difficulty-desc {
  color: rgba(255, 255, 255, 0.9);
}

.start-game-button {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #df0dee, #a505de);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: 1px;
  box-shadow: 0 2px 8px rgba(223, 13, 238, 0.13);
  transition: all 0.3s;
}

.start-game-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(223, 13, 238, 0.18);
}

.start-game-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  .guess-song-game {
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

  .options-container {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }

  .option-button {
    padding: 0.8rem;
    font-size: 0.9rem;
  }

  .button-group {
    gap: 0.8rem;
  }

  .submit-button, .next-button {
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

.answer-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.modal-content {
  background: #fff;
  border-radius: 16px;
  padding: 2rem 2.5rem;
  box-shadow: 0 8px 32px rgba(223, 13, 238, 0.10);
  text-align: center;
  min-width: 260px;
}
.wyy-link {
  display: inline-block;
  margin: 1rem 0;
  color: #a505de;
  font-weight: bold;
  text-decoration: underline;
  font-size: 1.1rem;
}
.song-desc {
  color: #7a3fa7;
  margin-bottom: 1rem;
}
.modal-close-button {
  margin-top: 1.2rem;
  padding: 0.7rem 1.5rem;
  background: linear-gradient(135deg, #df0dee, #a505de);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
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
  margin-bottom: 1.2rem;
}
.result-icon {
  font-size: 2.6rem;
  font-weight: bold;
  display: inline-block;
  vertical-align: middle;
  line-height: 1;
}
.result-icon.correct {
  color: #4CAF50;
  text-shadow: 0 2px 12px #b2f5c2;
}
.result-icon.wrong {
  color: #f44336;
  text-shadow: 0 2px 12px #ffc2c2;
}
.result-title {
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 2px;
  display: inline-block;
  vertical-align: middle;
  background: linear-gradient(90deg, #4CAF50, #b2f5c2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.result-title.wrong {
  background: linear-gradient(90deg, #f44336, #ffc2c2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>