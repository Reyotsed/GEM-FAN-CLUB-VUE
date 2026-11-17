<template>
  <div class="guess-song-game gx-page gx-purple">
    <header class="gx-header">
      <button class="gx-back" @click="$router.push('/games')" aria-label="返回">‹</button>
      <div class="gx-title-wrap">
        <span class="gx-icon">🎵</span>
        <h2 class="gx-title">听歌猜歌名</h2>
      </div>
      <span class="gx-spacer" />
    </header>

    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <template v-else>
      <!-- 难度选择界面 -->
      <div v-if="!gameStarted" class="gx-card">
        <h3 class="gx-section-h">选择难度</h3>
        <div class="gx-diff-options">
          <button
            class="gx-diff-btn"
            :class="{ 'is-active': selectedDifficulty === 1 }"
            @click="selectDifficulty(1)"
          >
            <span class="name">路人难度</span>
            <span class="desc">听过一些她的大火歌曲</span>
          </button>
          <button
            class="gx-diff-btn"
            :class="{ 'is-active': selectedDifficulty === 2 }"
            @click="selectDifficulty(2)"
          >
            <span class="name">歌迷难度</span>
            <span class="desc">对她的歌曲很熟悉</span>
          </button>
        </div>
        <div class="gx-actions">
          <button
            class="gx-btn gx-btn-primary gx-btn-block"
            :disabled="!selectedDifficulty"
            @click="startGame"
          >
            开始游戏
          </button>
        </div>
      </div>

      <!-- 进入游戏前展示排行榜 -->
      <div v-if="!gameStarted" class="gx-card gx-leaderboard">
        <h3>听歌识曲排行榜</h3>
        <div class="gx-tabs">
          <button class="gx-tab" :class="{ 'is-active': leaderboardTab === 1 }" @click="leaderboardTab = 1">路人难度</button>
          <button class="gx-tab" :class="{ 'is-active': leaderboardTab === 2 }" @click="leaderboardTab = 2">歌迷难度</button>
        </div>
        <div class="gx-lb-list">
          <div class="gx-lb-row gx-lb-head">
            <span class="gx-lb-rank">排名</span>
            <span class="gx-lb-name">昵称</span>
            <span class="gx-lb-score">得分</span>
            <span class="gx-lb-time">用时</span>
          </div>
          <div v-for="(record, index) in filteredLeaderboard" :key="index" class="gx-lb-row gx-lb-item">
            <span class="gx-lb-rank">{{ index + 1 }}</span>
            <span class="gx-lb-name">{{ record.nickname }}</span>
            <span class="gx-lb-score">{{ record.score }}</span>
            <span class="gx-lb-time">{{ formatTime(record.completionTime) }}</span>
          </div>
          <div v-if="filteredLeaderboard.length === 0" class="gx-lb-empty">
            暂无排行记录，快来成为第一名吧！
          </div>
        </div>
      </div>

      <template v-else>
        <!-- 进度 + 得分 -->
        <div v-if="!gameCompleted" class="gx-card">
          <div class="gx-dot-progress">
            <span
              v-for="i in 10"
              :key="i"
              class="gx-dot"
              :class="{
                'is-current': i - 1 === currentQuestion,
                'is-done': i - 1 < currentQuestion,
              }"
            ></span>
          </div>
          <div class="gx-stats-row">
            <div class="gx-stat">
              <span class="gx-stat-label">进度</span>
              <span class="gx-stat-value">{{ currentQuestion + 1 }}/10</span>
            </div>
            <div class="gx-stat">
              <span class="gx-stat-label">得分</span>
              <span class="gx-stat-value">{{ score }}</span>
            </div>
            <div class="gx-stat">
              <span class="gx-stat-label">用时</span>
              <span class="gx-stat-value">{{ formatTime(elapsedTime) }}</span>
            </div>
          </div>
        </div>

        <!-- 完成页 -->
        <div v-if="gameCompleted" class="gx-completed">
          <div class="gx-completed-anim"><span>✓</span></div>
          <h3>恭喜完成！</h3>
          <p>总得分：{{ score }}</p>
          <p>完成时间：{{ formatTime(completionTime) }}</p>
          <div class="gx-form" v-if="!hasRecorded">
            <input
              v-model="nickname"
              maxlength="10"
              placeholder="输入昵称保存记录"
              class="gx-input"
            />
            <button class="gx-btn gx-btn-primary gx-btn-block" @click="saveRecord">保存记录</button>
          </div>
          <div class="gx-actions">
            <button class="gx-btn gx-btn-ghost" @click="restartGame">再来一次</button>
          </div>
        </div>

        <!-- 游戏中 -->
        <template v-else>
          <Transition name="fade-slide" mode="out-in">
            <div :key="currentQuestion" class="game-content-wrapper">
              <div class="gx-card current-song-card">
                <div class="song-info">
                  <div class="audio-visualizer" :class="{ 'is-playing': isAudioPlaying }">
                    <span class="bar"></span>
                    <span class="bar"></span>
                    <span class="bar"></span>
                    <span class="bar"></span>
                  </div>
                  <p class="song-name">{{ isAudioPlaying ? '正在播放...' : '点击下方播放按钮开始' }}</p>
                </div>
                <AudioPlayer 
                  v-if="currentSong.realAudioUrl" 
                  :src="currentSong.realAudioUrl" 
                  @playing-change="handlePlayingChange"
                />
              </div>

              <div class="gx-card">
                <div class="options-grid">
                  <button
                    v-for="(option, index) in currentOptions"
                    :key="index"
                    class="option-btn"
                    :class="{
                      'selected': selectedAnswer === option && !showResult,
                      'correct': showResult && option === currentSong.title,
                      'wrong': showResult && selectedAnswer === option && option !== currentSong.title
                    }"
                    :disabled="showResult"
                    @click="selectAnswer(option)"
                  >
                    {{ option }}
                  </button>
                </div>
                <div class="gx-actions">
                  <button
                    class="gx-btn gx-btn-primary"
                    :disabled="!selectedAnswer || showResult"
                    @click="submitAnswer"
                  >提交</button>
                  <button
                    v-if="showResult"
                    class="gx-btn gx-btn-success"
                    @click="nextQuestion"
                  >下一题</button>
                </div>
              </div>
            </div>
          </Transition>

          <div class="gx-card gx-history">
            <h3>答题历史</h3>
            <TransitionGroup name="list" tag="ul">
              <li v-for="(item, index) in history" :key="item.song + index" :class="{ correct: item.isCorrect, incorrect: !item.isCorrect }">
                <div class="gx-history-row">
                  <span>{{ item.song }}</span>
                  <span>{{ item.isCorrect ? '✓' : '✗' }}</span>
                </div>
                <div v-if="!item.isCorrect" class="gx-history-correct">
                  正确答案：{{ item.correctAnswer }}
                </div>
              </li>
            </TransitionGroup>
          </div>
        </template>

        <!-- 游戏结束后排行榜 -->
        <div v-if="showLeaderboard" class="gx-card gx-leaderboard">
          <h3>听歌识曲排行榜</h3>
          <div class="gx-tabs">
            <button class="gx-tab" :class="{ 'is-active': leaderboardTab === 1 }" @click="leaderboardTab = 1">路人难度</button>
            <button class="gx-tab" :class="{ 'is-active': leaderboardTab === 2 }" @click="leaderboardTab = 2">歌迷难度</button>
          </div>
          <div class="gx-lb-list">
            <div class="gx-lb-row gx-lb-head">
              <span class="gx-lb-rank">排名</span>
              <span class="gx-lb-name">昵称</span>
              <span class="gx-lb-score">得分</span>
              <span class="gx-lb-time">用时</span>
            </div>
            <div v-for="(record, index) in filteredLeaderboard" :key="index" class="gx-lb-row gx-lb-item">
              <span class="gx-lb-rank">{{ index + 1 }}</span>
              <span class="gx-lb-name">{{ record.nickname }}</span>
              <span class="gx-lb-score">{{ record.score }}</span>
              <span class="gx-lb-time">{{ formatTime(record.completionTime) }}</span>
            </div>
            <div v-if="filteredLeaderboard.length === 0" class="gx-lb-empty">
              暂无排行记录，快来成为第一名吧！
            </div>
          </div>
        </div>
      </template>
    </template>

    <!-- 答题反馈弹窗 -->
    <div v-if="showAnswerModal" class="gx-modal" @click.self="closeAnswerModal">
      <div class="gx-modal-content">
        <div class="answer-result-row">
          <span :class="['result-icon', answerResult]">{{ answerResult === 'correct' ? '✔' : '✗' }}</span>
          <span :class="['result-title', answerResult]">
            {{ answerResult === 'correct' ? '回答正确！' : '回答错误' }}
          </span>
        </div>
        <p class="modal-song">正确答案：{{ answerSong.title }}</p>
        <a
          class="wyy-link"
          :href="'https://music.163.com/#/song?id=' + answerSong.wyyId"
          target="_blank"
          rel="noopener"
        >去网易云听这首歌</a>
        <p v-if="answerSong.discirbe" class="song-desc">{{ answerSong.discirbe }}</p>
        <div class="gx-actions">
          <button class="gx-btn gx-btn-primary" @click="closeAnswerModal">继续</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import apiClient from '@/utils/api'
import AudioPlayer from '@/components/audio/AudioPlayer.vue'
import { showToast } from '@/utils/toast'
import { trackEvent, EVENTS } from '@/utils/stats'
import { storage } from '@/utils/storage'
import './games-shared.css'

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
const elapsedTime = ref(0)
let timerInterval = null
const currentSong = ref({})
const currentOptions = ref([])
const selectedAnswer = ref(null)
const showResult = ref(false)
const isAudioPlaying = ref(false)

const showAnswerModal = ref(false)
const answerResult = ref('')
const answerSong = ref({})

const nickname = ref('')
const hasRecorded = ref(false)
const showLeaderboard = ref(false)
const leaderboard = ref([])
const leaderboardTab = ref(1)

const filteredLeaderboard = computed(() => {
  return leaderboard.value
    .filter(r => r.diffLevel === leaderboardTab.value)
    .slice()
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return (a.completionTime || 0) - (b.completionTime || 0)
    })
})

watch(selectedDifficulty, (v) => { if (v) leaderboardTab.value = v })

const selectDifficulty = (level) => {
  selectedDifficulty.value = level
  leaderboardTab.value = level
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
      elapsedTime.value = 0
      if (timerInterval) clearInterval(timerInterval)
      timerInterval = setInterval(() => {
        elapsedTime.value = Date.now() - startTime.value
      }, 1000)
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
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
    showLeaderboard.value = true
    loadLeaderboard()
    trackEvent(EVENTS.GAME_COMPLETE_GUESS_SONG)
    return
  }

  currentSong.value = songs.value[currentQuestion.value]
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
  currentOptions.value = options.sort(() => Math.random() - 0.5)
  selectedAnswer.value = null
  showResult.value = false
  isAudioPlaying.value = false
}

const handlePlayingChange = (playing) => {
  isAudioPlaying.value = playing
}

const selectAnswer = (answer) => {
  if (!showResult.value) selectedAnswer.value = answer
}

const submitAnswer = () => {
  if (!selectedAnswer.value || showResult.value) return
  
  const isCorrect = selectedAnswer.value === currentSong.value.title
  history.value.unshift({
    song: selectedAnswer.value,
    isCorrect,
    correctAnswer: currentSong.value.title
  })
  answerResult.value = isCorrect ? 'correct' : 'wrong'
  answerSong.value = { ...currentSong.value }
  
  // 触觉反馈
  if (navigator.vibrate) {
    if (isCorrect) {
      navigator.vibrate([50, 50, 50])
    } else {
      navigator.vibrate([100])
    }
  }
  
  showAnswerModal.value = true
  if (isCorrect) score.value += 10
  showResult.value = true
}

const nextQuestion = () => {
  currentQuestion.value++
  getNewQuestion()
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
  elapsedTime.value = 0
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
}

const formatTime = (ms) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds}秒`
}

const closeAnswerModal = () => { showAnswerModal.value = false }

const saveRecord = async () => {
  if (!nickname.value.trim()) return
  const params = {
    nickname: nickname.value,
    score: score.value,
    completionTime: completionTime.value,
    diffLevel: selectedDifficulty.value,
    userId: storage.getUserId() || ''
  }
  try {
    const response = await apiClient.post('/game/guess-song/submit-score', null, { params })
    if (response.data.code !== 200) throw new Error('保存失败')
    hasRecorded.value = true
    loadLeaderboard()
  } catch (err) {
    console.error('保存排行榜失败:', err)
    showToast('保存排行榜失败，请稍后重试', 'error')
  }
}

const loadLeaderboard = async () => {
  try {
    const response = await apiClient.get('/game/guess-song/getLeaderboard')
    if (response.data.code !== 200) throw new Error('获取排行榜失败')
    leaderboard.value = response.data.data || []
  } catch (err) {
    console.error('加载排行榜失败:', err)
    leaderboard.value = []
  }
}

onMounted(() => { loadLeaderboard() })
onUnmounted(() => { if (timerInterval) clearInterval(timerInterval) })
</script>

<style scoped>
.loading,
.error {
  text-align: center;
  padding: var(--space-8);
  color: var(--text-secondary);
}
.loading-spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid var(--gx-accent-soft);
  border-top-color: var(--gx-accent);
  margin: 0 auto 0.8rem;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ---------- 题号圆点进度 ---------- */
.gx-dot-progress {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 14px;
}
.gx-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.14);
  transition-property: transform, box-shadow, opacity, background, border-color;
  transition-duration: 0.3s;
  transition-timing-function: var(--ease-out);
}
.gx-dot.is-done {
  background: var(--gx-accent);
  border-color: var(--gx-accent);
  box-shadow: 0 0 8px var(--gx-accent-glow);
}
.gx-dot.is-current {
  width: 28px;
  background: linear-gradient(90deg, var(--gx-accent), #fff);
  border-color: var(--gx-accent);
  box-shadow: 0 0 12px var(--gx-accent-glow);
  animation: dotPulse 1.4s ease-in-out infinite;
}
@keyframes dotPulse {
  0%, 100% { box-shadow: 0 0 8px var(--gx-accent-glow); }
  50%      { box-shadow: 0 0 18px var(--gx-accent-glow); }
}

/* ---------- 当前播放卡片 ---------- */
.current-song-card {
  background:
    radial-gradient(circle at 20% 20%, var(--gx-accent-soft), transparent 38%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.03)),
    var(--gx-panel) !important;
}
.current-song-card .song-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
}
.audio-visualizer {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 24px;
  padding: 4px;
  border-radius: 8px;
  background: var(--gx-accent-soft);
}
.audio-visualizer .bar {
  width: 4px;
  background: var(--gx-accent);
  border-radius: 2px;
  transform: scaleY(0.3);
  transition: transform 0.2s;
}
.audio-visualizer.is-playing .bar {
  animation: bounce 0.5s ease infinite alternate;
}
.audio-visualizer.is-playing .bar:nth-child(1) { height: 60%; animation-delay: 0.1s; }
.audio-visualizer.is-playing .bar:nth-child(2) { height: 100%; animation-delay: 0.3s; }
.audio-visualizer.is-playing .bar:nth-child(3) { height: 40%; animation-delay: 0.0s; }
.audio-visualizer.is-playing .bar:nth-child(4) { height: 80%; animation-delay: 0.2s; }

@keyframes bounce {
  0% { transform: scaleY(0.3); }
  100% { transform: scaleY(1); }
}

.song-name {
  margin: 0;
  font-size: 0.94rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.88);
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.08); }
}

/* ---------- 选项 ---------- */
.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}
.option-btn {
  position: relative;
  min-height: 60px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  word-break: break-word;
  line-height: 1.35;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: transform 0.2s, border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.option-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  border-color: var(--gx-accent-line);
  background: var(--gx-accent-soft);
  color: #fff;
  box-shadow: 0 12px 24px var(--gx-accent-glow);
}
.option-btn.selected {
  background: linear-gradient(135deg, var(--gx-accent-soft), rgba(255, 255, 255, 0.06));
  border-color: var(--gx-accent);
  color: #fff;
  box-shadow: 0 0 18px var(--gx-accent-glow);
}
.option-btn.correct {
  background: linear-gradient(135deg, rgba(52, 211, 153, 0.18), rgba(110, 231, 183, 0.14));
  border-color: var(--gx-success);
  color: #fff;
  box-shadow: 0 0 22px rgba(52, 211, 153, 0.4);
}
.option-btn.wrong {
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.18), rgba(252, 165, 165, 0.14));
  border-color: var(--gx-danger);
  color: #fff;
  box-shadow: 0 0 22px rgba(248, 113, 113, 0.4);
  animation: shake 0.4s;
}
.option-btn:disabled { cursor: not-allowed; opacity: 0.85; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25%      { transform: translateX(-6px); }
  75%      { transform: translateX(6px); }
}

/* ---------- Modal ---------- */
.answer-result-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
}
.result-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  font-size: 1.5rem;
  font-weight: 800;
}
.result-icon.correct {
  color: var(--gx-success);
  background: rgba(52, 211, 153, 0.12);
  text-shadow: 0 0 14px rgba(52, 211, 153, 0.5);
}
.result-icon.wrong {
  color: var(--gx-danger);
  background: rgba(248, 113, 113, 0.12);
  text-shadow: 0 0 14px rgba(248, 113, 113, 0.5);
}
.result-title {
  font-size: 1.18rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  background: linear-gradient(90deg, var(--gx-success), #6EE7B7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.result-title.wrong {
  background: linear-gradient(90deg, var(--gx-danger), #FCA5A5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.modal-song {
  font-size: 0.96rem;
  color: rgba(255, 255, 255, 0.88);
  margin: 6px 0;
}
.wyy-link {
  display: inline-block;
  margin: 10px 0;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gx-accent);
  text-decoration: none;
  background: var(--gx-accent-soft);
  border: 1px solid var(--gx-accent-line);
  border-radius: 999px;
  transition-property: transform, box-shadow, opacity;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}
.wyy-link:hover {
  color: #fff;
  background: var(--gx-accent);
  transform: translateY(-2px);
}
.song-desc {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.66);
  line-height: 1.6;
  margin: 8px 0 12px;
}

/* ---------- 移动端 ---------- */
@media (max-width: 480px) {
  .options-grid { grid-template-columns: 1fr; gap: 8px; }
  .option-btn { min-height: 50px; padding: 12px 14px; font-size: 0.88rem; }
  .gx-dot { width: 10px; height: 10px; }
  .gx-dot.is-current { width: 22px; }
  .song-name { font-size: 0.86rem; }
  .audio-visualizer { height: 20px; }
  .audio-visualizer .bar { width: 3px; }
  .result-icon { width: 38px; height: 38px; font-size: 1.3rem; }
  .result-title { font-size: 1.05rem; }
}

/* ---------- 过渡动画 ---------- */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition-property: transform, box-shadow, opacity, background, border-color;
  transition-duration: 0.3s;
  transition-timing-function: ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.list-enter-active,
.list-leave-active {
  transition-property: transform, opacity;
  transition-duration: 0.4s;
  transition-timing-function: ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
