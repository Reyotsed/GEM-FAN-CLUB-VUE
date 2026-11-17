<template>
  <div class="audio-player">
    <audio
      ref="audio"
      :src="src"
      @canplay="onCanPlay"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
    ></audio>
    <div class="player-controls">
      <button
        class="player-btn"
        @click="playPause"
        :aria-label="isPlaying ? '暂停' : '播放'"
      >
        <svg v-if="!isPlaying" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
        </svg>
      </button>
      <div class="progress-wrap">
        <input type="range" min="0" max="100" step="0.1" v-model="progress" @input="setProgress" class="progress-range" :style="rangeStyle" />
      </div>
      <span class="progress-time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from 'vue'
const props = defineProps({ src: String })
const emit = defineEmits(['playing-change'])

const audio = ref(null)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
const isPlaying = ref(false)

const onTimeUpdate = () => {
  if (!audio.value) return
  currentTime.value = audio.value.currentTime
  progress.value = duration.value ? (currentTime.value / duration.value) * 100 : 0
}
const onLoadedMetadata = () => {
  if (!audio.value) return
  duration.value = audio.value.duration
}
const onCanPlay = () => {
  if (!audio.value) return
  duration.value = audio.value.duration
}
const playPause = () => {
  if (!audio.value) return
  if (isPlaying.value) audio.value.pause()
  else audio.value.play()
  isPlaying.value = !isPlaying.value
  emit('playing-change', isPlaying.value)
}
const setProgress = () => {
  if (!audio.value) return
  audio.value.currentTime = (progress.value / 100) * duration.value
}
const onEnded = () => {
  isPlaying.value = false
  emit('playing-change', false)
}
const formatTime = (time) => {
  if (!isNaN(time)) {
    const m = Math.floor(time / 60)
    const s = Math.floor(time % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return '00:00'
}
const rangeStyle = computed(() => ({
  background: `linear-gradient(90deg, #D946EF 0%, #A21CAF ${progress.value}%, rgba(255,255,255,0.12) ${progress.value}%, rgba(255,255,255,0.12) 100%)`
}))
watch(() => props.src, () => {
  isPlaying.value = false
  emit('playing-change', false)
  currentTime.value = 0
  progress.value = 0
})

// 组件销毁时暂停音频，防止后台继续触发 timeupdate 导致 null ref 访问
onUnmounted(() => {
  const el = audio.value
  if (el) {
    el.pause()
    el.removeAttribute('src')
    el.load()
  }
})
</script>

<style scoped>
.audio-player {
  width: 100%;
  margin: 0 auto;
}
audio { display: none; }

.player-controls {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
}

.player-btn {
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #D946EF 0%, #A21CAF 100%);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(200, 80, 232, 0.35);
  transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
  padding: 0;
}
.player-btn:hover { filter: brightness(1.08); transform: scale(1.05); }
.player-btn:active { transform: scale(0.95); }

.progress-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}

.progress-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  outline: none;
  cursor: pointer;
}
.progress-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #D946EF;
  box-shadow: 0 2px 6px rgba(200, 80, 232, 0.4);
  cursor: pointer;
}
.progress-range::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #D946EF;
  cursor: pointer;
}

.progress-time {
  flex: 0 0 auto;
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  white-space: nowrap;
}

@media (max-width: 480px) {
  .player-controls { gap: 0.5rem; }
  .player-btn { width: 34px; height: 34px; }
  .progress-time { font-size: 0.7rem; }
}
</style>