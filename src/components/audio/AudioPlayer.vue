<template>
  <div class="audio-player">
    <audio
      ref="audio"
      :src="src"
      @canplay="onCanPlay"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
      style="width: 100%;"
    ></audio>
    <div class="player-controls">
      <button class="player-btn" @click="playPause">{{ isPlaying ? '暂停' : '播放' }}</button>
      <div class="progress-bar">
        <input type="range" min="0" max="100" v-model="progress" @input="setProgress" class="progress-range" />
        <span class="progress-time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps } from 'vue'
const props = defineProps({ src: String })

const audio = ref(null)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
const isPlaying = ref(false)
const circulate = ref(false)

const onTimeUpdate = () => {
  currentTime.value = audio.value.currentTime
  progress.value = (currentTime.value / duration.value) * 100
}
const onLoadedMetadata = () => {
  duration.value = audio.value.duration
}
const onCanPlay = () => {
  duration.value = audio.value.duration
}
const playPause = () => {
  if (isPlaying.value) {
    audio.value.pause()
  } else {
    audio.value.play()
  }
  isPlaying.value = !isPlaying.value
}
const setProgress = () => {
  audio.value.currentTime = (progress.value / 100) * duration.value
}
const isCirculate = () => {
  circulate.value = !circulate.value
  audio.value.loop = circulate.value
}
const onEnded = () => {
  isPlaying.value = false
}
const formatTime = (time) => {
  if (!isNaN(time)) {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return '00:00'
}
watch(() => props.src, () => {
  isPlaying.value = false
  currentTime.value = 0
  progress.value = 0
})
</script>

<style scoped>
.audio-player {
  width: 100%;
  margin: 0 auto;
  background: none;
  border-radius: 12px;
  padding: 0.5rem 0.5rem 0.7rem 0.5rem;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin-top: 0.5rem;
  width: 100%;
  justify-content: center;
}

.player-btn {
  background: linear-gradient(135deg, #df0dee 0%, #a505de 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(223, 13, 238, 0.10);
  transition: all 0.2s;
  outline: none;
}
.player-btn:hover {
  filter: brightness(1.08) saturate(1.2);
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 4px 16px rgba(223, 13, 238, 0.18);
}

.progress-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 120px;
  max-width: 320px;
}

.progress-range {
  flex: 1;
  height: 7px;
  border-radius: 6px;
  background: linear-gradient(90deg, #df0dee 0%, #a505de 100%);
  outline: none;
  accent-color: #df0dee;
  transition: background 0.3s;
}
.progress-range::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #df0dee;
  box-shadow: 0 2px 8px rgba(223, 13, 238, 0.13);
  cursor: pointer;
  transition: background 0.3s;
}
.progress-range:focus::-webkit-slider-thumb {
  background: #df0dee;
}
.progress-time {
  min-width: 70px;
  font-size: 1rem;
  color: #7a3fa7;
  font-weight: 500;
  text-align: right;
}

@media (max-width: 600px) {
  .audio-player {
    padding: 0.3rem 0.1rem 0.5rem 0.1rem;
  }
  .player-controls {
    flex-direction: column;
    gap: 0.7rem;
    align-items: stretch;
  }
  .progress-bar {
    min-width: 80px;
    max-width: 100%;
  }
  .progress-time {
    font-size: 0.95rem;
  }
}
</style>