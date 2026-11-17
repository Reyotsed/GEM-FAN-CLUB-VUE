<template>
  <div class="lyrics-chain-game gx-page">
    <header class="gx-header">
      <button class="gx-back" @click="$router.push('/games')" aria-label="返回">‹</button>
      <div class="gx-title-wrap">
        <span class="gx-icon">📝</span>
        <h2 class="gx-title">歌词接龙</h2>
      </div>
      <span class="gx-spacer" />
    </header>

    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <template v-else>
      <!-- 难度选择 -->
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
          >开始游戏</button>
        </div>
      </div>

      <div v-if="!gameStarted" class="gx-card gx-leaderboard">
        <h3>歌词接龙排行榜</h3>
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

        <!-- 完成 -->
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
              <div class="gx-card current-lyric-card">
                <div class="song-info">
                  <span class="song-icon">🎵</span>
                  <p class="song-name">{{ currentLyric.song }}</p>
                </div>
              </div>

              <div class="gx-card">
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
                <div class="gx-actions">
                  <button class="gx-btn gx-btn-primary" @click="submitAnswer">提交</button>
                  <button class="gx-btn gx-btn-danger" @click="giveUp">放弃</button>
                </div>
              </div>
            </div>
          </Transition>

          <div class="gx-card gx-history">
            <h3>答题历史</h3>
            <TransitionGroup name="list" tag="ul">
              <li v-for="(item, index) in history" :key="item.lyric + index" :class="{ correct: item.isCorrect, incorrect: !item.isCorrect }">
                <div class="gx-history-row">
                  <span>{{ item.lyric }}</span>
                  <span>{{ item.isCorrect ? '✓' : '✗' }}</span>
                </div>
                <div v-if="!item.isCorrect" class="gx-history-correct">
                  正确答案：{{ item.correctAnswer }}
                </div>
              </li>
            </TransitionGroup>
          </div>
        </template>

        <div v-if="showLeaderboard" class="gx-card gx-leaderboard">
          <h3>歌词接龙排行榜</h3>
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

    <!-- 答错弹窗 -->
    <div v-if="showAnswerModal" class="gx-modal" @click.self="closeAnswerModal">
      <div class="gx-modal-content">
        <h3 class="modal-h3">查看答案</h3>
        <p class="modal-song">歌曲：{{ currentLyric.song }}</p>
        <div class="answer-comparison">
          <div class="answer-item">
            <span class="answer-label">你的答案</span>
            <span class="user-answer">{{ displayLyric }}</span>
          </div>
          <div class="answer-item">
            <span class="answer-label">正确答案</span>
            <span class="correct-answer-text">{{ currentLyric.lyric }}</span>
          </div>
        </div>
        <div class="gx-actions">
          <button class="gx-btn gx-btn-primary" @click="closeAnswerModal">继续</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import apiClient from '@/utils/api'
import { showToast } from '@/utils/toast'
import { trackEvent, EVENTS } from '@/utils/stats'
import { storage } from '@/utils/storage'
import './games-shared.css'

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
const elapsedTime = ref(0)
let timerInterval = null
const currentQuestion = ref(0)
const showAnswerModal = ref(false)
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

let availableLyrics = []
const gameStarted = ref(false)
const selectedDifficulty = ref(null)

const lyricParts = computed(() => {
  if (!currentLyric.value.guess) return []
  const parts = []
  const text = currentLyric.value.guess
  let lastIndex = 0
  let inputIndex = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '？') {
      if (i > lastIndex) {
        parts.push({ text: text.slice(lastIndex, i), isQuestion: false })
      }
      parts.push({ text: '', isQuestion: true, inputIndex: inputIndex++ })
      lastIndex = i + 1
    }
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isQuestion: false })
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
    if (/[\u4e00-\u9fa5]/.test(value[0])) {
      const remainingChars = value.slice(1)
      let currentIndex = index + 1
      userInputs.value[index] = value[0]
      for (let i = 0; i < remainingChars.length; i++) {
        if (currentIndex < userInputs.value.length && /[\u4e00-\u9fa5]/.test(remainingChars[i])) {
          userInputs.value[currentIndex] = remainingChars[i]
          currentIndex++
        }
      }
      nextTick(() => {
        if (currentIndex - 1 < inputRefs.value.length) {
          inputRefs.value[currentIndex - 1].focus()
        }
      })
    } else {
      userInputs.value[index] = ''
    }
  }
}

const handleKeydown = (event, index) => {
  if (event.key === 'Backspace' && !userInputs.value[index]) {
    const prevIndex = index - 1
    if (prevIndex >= 0) {
      nextTick(() => { inputRefs.value[prevIndex].focus() })
    }
  }
}

const startGame = () => {
  try {
    let filteredLyrics = availableLyrics.filter(l => l.guess)
    if (selectedDifficulty.value === 1) {
      filteredLyrics = filteredLyrics.filter(l => l.level === 1)
    }
    if (filteredLyrics.length === 0) throw new Error('没有可用的歌词题目')

    availableLyrics = []
    const usedIndices = new Set()
    while (availableLyrics.length < 10 && availableLyrics.length < filteredLyrics.length) {
      const idx = Math.floor(Math.random() * filteredLyrics.length)
      if (!usedIndices.has(idx)) {
        availableLyrics.push(filteredLyrics[idx])
        usedIndices.add(idx)
      }
    }

    score.value = 0
    streak.value = 0
    history.value = []
    currentQuestion.value = 0
    gameCompleted.value = false
    startTime.value = Date.now()
    elapsedTime.value = 0
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      elapsedTime.value = Date.now() - startTime.value
    }, 1000)
    gameStarted.value = true
    trackEvent(EVENTS.GAME_START_LYRICS_CHAIN)
    getNewLyric()
  } catch (err) {
    error.value = '加载游戏数据失败，请稍后重试'
  }
}

const getNewLyric = () => {
  if (currentQuestion.value >= 10) {
    gameCompleted.value = true
    completionTime.value = Date.now() - startTime.value
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
    showLeaderboard.value = true
    loadLeaderboard()
    trackEvent(EVENTS.GAME_COMPLETE_LYRICS_CHAIN)
    return
  }
  currentLyric.value = availableLyrics[currentQuestion.value]
  userInputs.value = Array(lyricParts.value.filter(p => p.isQuestion).length).fill('')
}

const showModal = () => { showAnswerModal.value = true }

const closeAnswerModal = () => {
  showAnswerModal.value = false
  currentQuestion.value++
  getNewLyric()
}

const submitAnswer = () => {
  if (userInputs.value.some(input => !input.trim())) return
  const isCorrect = checkAnswer()
  history.value.unshift({
    lyric: displayLyric.value,
    isCorrect,
    correctAnswer: isCorrect ? null : currentLyric.value.lyric
  })
  if (isCorrect) {
    score.value += 10
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
  elapsedTime.value = 0
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
}

const formatTime = (ms) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds}秒`
}

const checkAnswer = () => displayLyric.value === currentLyric.value.lyric

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
    const response = await apiClient.post('/game/lyrics-chain/submit-score', null, { params })
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
    const response = await apiClient.get('/game/lyrics-chain/getLeaderboard')
    if (response.data.code !== 200) throw new Error('获取排行榜失败')
    leaderboard.value = response.data.data || []
  } catch (err) {
    console.error('加载排行榜失败:', err)
    leaderboard.value = []
  }
}

const selectDifficulty = (level) => {
  selectedDifficulty.value = level
  leaderboardTab.value = level
}

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

/* ---------- 当前歌曲卡片 ---------- */
.current-lyric-card {
  background:
    radial-gradient(circle at 22% 20%, var(--gx-accent-soft), transparent 38%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.03)),
    var(--gx-panel) !important;
}
.current-lyric-card .song-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
}
.song-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--gx-accent-soft);
  font-size: 1.05rem;
  color: var(--gx-accent);
  filter: drop-shadow(0 0 6px var(--gx-accent-glow));
  animation: pulse 2s infinite;
}
.song-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.94);
  letter-spacing: 0.4px;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.08); }
}

/* ---------- 输入区 ---------- */
.inputs-container {
  word-break: break-all;
  white-space: normal;
  padding: 16px 14px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.03)),
    rgba(0, 0, 0, 0.20);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 16px;
  margin-bottom: 14px;
  text-align: center;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.lyric-text {
  display: inline;
  font-size: 1.06rem;
  line-height: 2.1;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
}
.lyric-input {
  display: inline-block;
  width: 1.9em;
  min-width: 36px;
  height: 40px;
  padding: 0;
  margin: 0 4px;
  vertical-align: middle;
  border: 1.5px solid var(--gx-accent-line);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s;
}
.lyric-input:focus {
  outline: none;
  border-color: var(--gx-accent);
  background: rgba(255, 255, 255, 0.10);
  box-shadow: 0 0 0 3px var(--gx-accent-soft), 0 0 14px var(--gx-accent-glow);
  transform: translateY(-1px);
}

/* ---------- 答案对比 Modal ---------- */
.modal-h3 {
  margin: 0 0 8px;
  font-size: 1.18rem;
  font-weight: 800;
  color: #fff;
}
.modal-song {
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.66);
  margin: 0 0 12px;
}
.answer-comparison {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
}
.answer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 12px;
  text-align: left;
}
.answer-label {
  flex: 0 0 60px;
  font-size: 0.74rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.5px;
}
.user-answer,
.correct-answer-text {
  flex: 1;
  font-size: 0.94rem;
  word-break: break-all;
  line-height: 1.5;
}
.user-answer { color: #FCA5A5; }
.correct-answer-text { color: #6EE7B7; }

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

@media (max-width: 480px) {
  .gx-dot { width: 10px; height: 10px; }
  .gx-dot.is-current { width: 22px; }
  .lyric-text { font-size: 0.94rem; line-height: 1.95; }
  .lyric-input {
    width: 1.7em;
    min-width: 30px;
    height: 36px;
    margin: 0 3px;
    border-radius: 8px;
    font-size: 0.9rem;
  }
  .song-name { font-size: 0.92rem; }
  .answer-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  .answer-label { flex: none; }
}
</style>