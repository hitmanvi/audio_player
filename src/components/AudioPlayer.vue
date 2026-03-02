<template>
  <div class="w-full max-w-md rounded-2xl bg-slate-900/80 backdrop-blur border border-slate-700/50 p-6 shadow-xl">
    <audio ref="audioEl" :src="currentSrc" @loadedmetadata="onLoadedMetadata" @timeupdate="onTimeUpdate" @ended="onEnded" @play="isPlaying = true" @pause="isPlaying = false" />
    <!-- 封面/占位 -->
    <div class="aspect-square w-full max-w-[200px] mx-auto mb-6 rounded-xl bg-slate-800 flex items-center justify-center">
      <svg v-if="!currentSrc" class="w-16 h-16 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
      </svg>
      <div v-else class="w-full h-full flex items-center justify-center">
        <div class="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <svg class="w-10 h-10 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- 文件名 -->
    <p class="text-center text-slate-400 text-sm truncate mb-4 px-2">
      {{ currentFileName || '未选择音频文件' }}
    </p>

    <!-- 进度条 -->
    <div class="mb-4">
      <input
        v-model.number="progress"
        type="range"
        min="0"
        :max="duration || 0"
        step="0.1"
        class="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700 accent-emerald-500"
        @input="onSeek"
      />
      <div class="flex justify-between text-xs text-slate-500 mt-1">
        <span>{{ formatTime(currentTime) }}</span>
        <span>{{ formatTime(duration) }}</span>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="flex items-center justify-center gap-4">
      <button
        type="button"
        class="p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
        title="打开文件"
        @click="openFile"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
        </svg>
      </button>

      <button
        type="button"
        class="p-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :title="isPlaying ? '暂停' : '播放'"
        :disabled="!currentSrc"
        @click="togglePlay"
      >
        <svg v-if="!isPlaying" class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
        <svg v-else class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      </button>

      <!-- 音量 -->
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
        </svg>
        <input
          v-model.number="volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          class="w-20 h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700 accent-emerald-500"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const audioEl = ref(null)
const currentSrc = ref('')
const currentFileName = ref('')
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.8)
const progress = ref(0)

const formatTime = (seconds) => {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const togglePlay = () => {
  if (!audioEl.value || !currentSrc.value) return
  if (isPlaying.value) {
    audioEl.value.pause()
  } else {
    audioEl.value.play()
  }
}

const openFile = async () => {
  if (!window.electronAPI?.openAudioFile) return
  const fileUrl = await window.electronAPI.openAudioFile()
  if (fileUrl) {
    currentSrc.value = fileUrl
    currentFileName.value = decodeURIComponent(fileUrl.split('/').pop() || fileUrl.split('\\').pop() || '音频文件')
    isPlaying.value = false
    progress.value = 0
    currentTime.value = 0
    duration.value = 0
  }
}

const onSeek = (e) => {
  if (!audioEl.value) return
  const val = parseFloat(e.target.value)
  audioEl.value.currentTime = val
  currentTime.value = val
}

const onLoadedMetadata = () => {
  duration.value = audioEl.value.duration
}

const onTimeUpdate = () => {
  if (audioEl.value) {
    currentTime.value = audioEl.value.currentTime
    progress.value = audioEl.value.currentTime
  }
}

const onEnded = () => {
  isPlaying.value = false
  progress.value = 0
  currentTime.value = 0
}

watch(volume, (v) => {
  if (audioEl.value) audioEl.value.volume = v
})
</script>
