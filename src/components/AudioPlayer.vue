<template>
  <div class="flex h-full overflow-hidden">
    <audio ref="audioEl" :src="currentBlobUrl" @loadedmetadata="onLoadedMetadata" @timeupdate="onTimeUpdate" @ended="onEnded" @play="isPlaying = true" @pause="isPlaying = false" />

    <!-- 播放列表 - 左侧独立区域 -->
    <aside
      class="shrink-0 flex flex-col border-r border-emerald-800/60 bg-emerald-950/50 transition-all duration-300 ease-in-out overflow-hidden"
      :class="playlistCollapsed ? 'w-0 min-w-0 border-r-0' : 'w-64'"
    >
      <div class="flex items-center justify-between px-4 py-2.5 border-b border-emerald-800/50 shrink-0 w-64">
        <h2 class="text-xs font-semibold uppercase tracking-widest text-emerald-400/90">播放列表</h2>
        <button
          type="button"
          class="p-1.5 rounded-md text-emerald-500/80 hover:text-emerald-300 hover:bg-emerald-800/40 transition-colors"
          title="收起播放列表"
          @click="playlistCollapsed = true"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>
      <div class="playlist-scroll flex-1 min-h-0 overflow-y-auto w-64 shrink-0 py-2 px-2">
        <template v-if="playlist.length > 0">
          <button
            v-for="(item, idx) in playlist"
            :key="item.url"
            type="button"
            class="w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition-all duration-200 flex items-center gap-3 group"
            :class="idx === currentIndex ? 'bg-emerald-500/25 text-emerald-200 shadow-sm' : 'text-emerald-400/70 hover:bg-emerald-800/30 hover:text-emerald-300'"
            @click="playTrack(idx)"
          >
            <span
              class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors"
              :class="idx === currentIndex ? 'bg-emerald-500/40 text-emerald-200' : 'bg-emerald-800/50 text-emerald-500/80 group-hover:bg-emerald-700/50'"
            >
              <svg v-if="idx === currentIndex && isPlaying" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
              <template v-else>{{ idx + 1 }}</template>
            </span>
            <span class="truncate flex-1 min-w-0">{{ item.name }}</span>
          </button>
        </template>
        <div v-else class="flex flex-col items-center justify-center py-12 px-4 text-center">
          <svg class="w-12 h-12 text-emerald-700/60 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 6l12-3M9 6v13"/>
          </svg>
          <p class="text-emerald-500/80 text-sm">暂无曲目</p>
          <p class="text-emerald-600/70 text-xs mt-1">打开文件或文件夹添加</p>
        </div>
      </div>
    </aside>

    <!-- 播放器 - 右侧独立区域 -->
    <main class="flex-1 min-w-0 flex flex-col items-center justify-center p-6 bg-emerald-950 relative">
      <!-- 收起时显示展开按钮 -->
      <button
        v-if="playlistCollapsed"
        type="button"
        class="absolute left-0 top-1/2 -translate-y-1/2 py-3 px-1 rounded-r-lg bg-emerald-900/80 border border-l-0 border-emerald-800 text-emerald-500 hover:text-emerald-300 hover:bg-emerald-800/60 transition-colors"
        title="展开播放列表"
        @click="playlistCollapsed = false"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
      <!-- 点唱机 / 歌词 区域 -->
      <div class="w-[200px] h-[240px] flex flex-col">
        <div class="flex-1 min-h-0 w-full overflow-hidden flex items-center justify-center">
          <!-- 点唱机唱片 -->
          <div
            v-show="!showLyrics"
            class="jukebox-record"
            :class="{ 'jukebox-record--playing': isPlaying }"
          >
            <div class="record-outer">
              <div class="record-label">
                <img
                  v-if="coverBlobUrl"
                  :src="coverBlobUrl"
                  alt="封面"
                  class="record-cover"
                />
                <svg v-else-if="!currentBlobUrl" class="w-12 h-12 text-emerald-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
                <div v-else class="w-full h-full flex items-center justify-center">
                  <svg class="w-12 h-12 text-emerald-400/70" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              <div class="record-hole" />
            </div>
          </div>
          <!-- 歌词 -->
          <div
            v-show="showLyrics"
            ref="lyricsContainer"
            class="lyrics-scroll w-full h-full overflow-y-auto px-4 py-2 scroll-smooth"
          >
            <template v-if="lyrics.length > 0">
              <p
                v-for="(line, i) in lyrics"
                :key="i"
                class="leading-relaxed py-1 transition-colors"
                :class="i === currentLyricIndex ? 'text-lg text-emerald-300 font-medium' : 'text-base text-emerald-500/70'"
              >
                {{ line.text }}
              </p>
            </template>
            <template v-else-if="currentBlobUrl && lyricsLoaded">
              <div class="flex flex-col items-center justify-center h-full gap-2">
                <p class="text-emerald-600/80 text-xs">暂无歌词</p>
                <button
                  type="button"
                  class="text-xs text-emerald-500 hover:text-emerald-400 underline"
                  @click="openLrcFile"
                >
                  手动加载
                </button>
              </div>
            </template>
            <p v-else class="text-emerald-600/80 text-xs text-center">加载歌词中…</p>
          </div>
        </div>
      </div>

      <!-- 控制区：文件名 + 按钮 + 进度条 -->
      <div class="w-full max-w-sm mt-auto pt-3 border-t border-emerald-800/50 flex flex-col gap-3">
        <p class="text-center text-emerald-400/90 text-xs truncate px-2">
          {{ currentFileName || '未选择音频文件' }}
        </p>
        <div class="flex items-center justify-center gap-2 flex-wrap">
          <button
            type="button"
            class="p-2 rounded-full text-emerald-500 hover:text-emerald-300 hover:bg-emerald-800/50 transition-colors"
            title="打开文件"
            @click="openFile"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
          </button>
          <button
            type="button"
            class="p-2 rounded-full text-emerald-500 hover:text-emerald-300 hover:bg-emerald-800/50 transition-colors"
            title="打开文件夹"
            @click="openFolder"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
          </button>
          <button
            type="button"
            class="p-2 rounded-full transition-colors"
            :title="showLyrics ? '切换到唱片' : '切换到歌词'"
            @click="showLyrics = !showLyrics"
          >
            <svg v-if="showLyrics" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" stroke-width="2"/>
              <circle cx="12" cy="12" r="2" fill="currentColor"/>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </button>
          <button
            type="button"
            class="p-2 rounded-full bg-emerald-400 hover:bg-emerald-300 text-emerald-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :title="isPlaying ? '暂停' : '播放'"
            :disabled="!currentBlobUrl"
            @click="togglePlay"
          >
            <svg v-if="!isPlaying" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
            <input
              v-model.number="volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              class="w-16 h-1.5 rounded-full appearance-none cursor-pointer bg-emerald-800 accent-emerald-400"
            />
          </div>
        </div>
        <div>
          <input
            v-model.number="progress"
            type="range"
            min="0"
            :max="duration || 0"
            step="0.1"
            class="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-emerald-800 accent-emerald-400"
            @input="onSeek"
          />
          <div class="flex justify-between text-xs text-emerald-600 mt-1">
            <span>{{ formatTime(currentTime) }}</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const audioEl = ref(null)
const currentSrc = ref('')
const currentFileName = ref('')
const currentBlobUrl = ref('')
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.8)
const progress = ref(0)
const playlist = ref([])
const currentIndex = ref(-1)
const coverBlobUrl = ref('')
const playlistCollapsed = ref(false)
const lyrics = ref([])
const currentLyricIndex = ref(-1)
const lyricsLoaded = ref(false)
const lyricsContainer = ref(null)
const showLyrics = ref(false)

const getFileName = (url) => {
  try {
    return decodeURIComponent(url.split('/').pop() || url.split('\\').pop() || '音频文件')
  } catch {
    return '音频文件'
  }
}

function parseLrc(text) {
  const lines = []
  const regex = /\[(\d{1,2}):(\d{2})(?:\.(\d{2,3}))?](.*)/g
  let m
  while ((m = regex.exec(text)) !== null) {
    const min = parseInt(m[1], 10)
    const sec = parseInt(m[2], 10)
    const ms = m[3] ? parseInt(m[3].padEnd(3, '0'), 10) : 0
    const time = min * 60 + sec + ms / 1000
    const text_ = m[4].trim()
    if (text_) lines.push({ time, text: text_ })
  }
  lines.sort((a, b) => a.time - b.time)
  return lines
}

const loadLyrics = async (lrcUrl) => {
  lyrics.value = []
  currentLyricIndex.value = -1
  lyricsLoaded.value = false
  if (!lrcUrl || !lrcUrl.startsWith('local-file://')) {
    lyricsLoaded.value = true
    return
  }
  try {
    const res = await fetch(lrcUrl)
    if (res.ok) {
      const text = await res.text()
      lyrics.value = parseLrc(text)
    }
  } catch (err) {
    console.error('加载歌词失败:', err)
  }
  lyricsLoaded.value = true
}

const formatTime = (seconds) => {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const togglePlay = () => {
  if (!audioEl.value || !currentBlobUrl.value) return
  if (isPlaying.value) {
    audioEl.value.pause()
  } else {
    audioEl.value.play()
  }
}

const loadCover = async (coverUrl) => {
  if (coverBlobUrl.value) {
    URL.revokeObjectURL(coverBlobUrl.value)
    coverBlobUrl.value = ''
  }
  if (coverUrl && coverUrl.startsWith('local-file://')) {
    try {
      const res = await fetch(coverUrl)
      if (res.ok) {
        const blob = await res.blob()
        coverBlobUrl.value = URL.createObjectURL(blob)
      }
    } catch (err) {
      console.error('加载封面失败:', err)
    }
  }
}

const loadTrack = async (url, coverUrl, lrcUrl) => {
  if (currentBlobUrl.value) {
    URL.revokeObjectURL(currentBlobUrl.value)
    currentBlobUrl.value = ''
  }
  currentSrc.value = url
  currentFileName.value = getFileName(url)
  progress.value = 0
  currentTime.value = 0
  duration.value = 0
  if (coverUrl) await loadCover(coverUrl)
  else if (coverBlobUrl.value) {
    URL.revokeObjectURL(coverBlobUrl.value)
    coverBlobUrl.value = ''
  }
  if (url && url.startsWith('local-file://')) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(res.statusText)
      const blob = await res.blob()
      currentBlobUrl.value = URL.createObjectURL(blob)
    } catch (err) {
      console.error('加载音频失败:', err)
    }
  } else {
    currentBlobUrl.value = url || ''
  }
  await loadLyrics(lrcUrl)
}

const playTrack = async (idx) => {
  if (idx < 0 || idx >= playlist.value.length) return
  currentIndex.value = idx
  const item = playlist.value[idx]
  await loadTrack(item.url, item.coverUrl, item.lrcUrl)
  isPlaying.value = true
  audioEl.value?.play()
}

const openFile = async () => {
  if (!window.electronAPI?.openAudioFile) return
  const result = await window.electronAPI.openAudioFile()
  if (result?.url) {
    playlist.value = [{ url: result.url, name: getFileName(result.url), coverUrl: result.coverUrl, lrcUrl: result.lrcUrl }]
    currentIndex.value = 0
    await loadTrack(result.url, result.coverUrl, result.lrcUrl)
    isPlaying.value = false
  }
}

const openLrcFile = async () => {
  if (!window.electronAPI?.openLrcFile) return
  const lrcUrl = await window.electronAPI.openLrcFile()
  if (lrcUrl) {
    const idx = currentIndex.value
    if (idx >= 0 && playlist.value[idx]) {
      playlist.value[idx].lrcUrl = lrcUrl
    }
    await loadLyrics(lrcUrl)
  }
}

const openFolder = async () => {
  if (!window.electronAPI?.openAudioFolder) return
  const result = await window.electronAPI.openAudioFolder()
  if (result?.urls?.length > 0) {
    const coverUrl = result.coverUrl || null
    const lrcUrls = result.lrcUrls || []
    playlist.value = result.urls.map((url, i) => ({
      url,
      name: getFileName(url),
      coverUrl,
      lrcUrl: lrcUrls[i] || null,
    }))
    currentIndex.value = 0
    await loadTrack(result.urls[0], coverUrl, lrcUrls[0] || null)
    isPlaying.value = true
    audioEl.value?.play()
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
    if (lyrics.value.length > 0) {
      let idx = -1
      for (let i = lyrics.value.length - 1; i >= 0; i--) {
        if (currentTime.value >= lyrics.value[i].time) {
          idx = i
          break
        }
      }
      if (idx !== currentLyricIndex.value) {
        currentLyricIndex.value = idx
        nextTick(() => {
          const container = lyricsContainer.value
          if (container && idx >= 0 && container.children[idx]) {
            container.children[idx].scrollIntoView({ block: 'center', behavior: 'smooth' })
          }
        })
      }
    }
  }
}

const onEnded = () => {
  isPlaying.value = false
  progress.value = 0
  currentTime.value = 0
  if (playlist.value.length > 0 && currentIndex.value < playlist.value.length - 1) {
    playTrack(currentIndex.value + 1)
  }
}

watch(volume, (v) => {
  if (audioEl.value) audioEl.value.volume = v
})
</script>

<style scoped>
.lyrics-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.lyrics-scroll::-webkit-scrollbar {
  display: none;
}

.playlist-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.playlist-scroll::-webkit-scrollbar {
  display: none;
}

.jukebox-record {
  --record-size: 160px;
  --label-size: 55%;
  --hole-size: 12%;
  width: var(--record-size);
  height: var(--record-size);
  display: flex;
  align-items: center;
  justify-content: center;
}

.jukebox-record--playing .record-outer {
  animation: record-spin 3.5s linear infinite;
}

@keyframes record-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.record-outer {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    #0f2e24 0%,
    #052e20 25%,
    #022c22 50%,
    #064e3b 75%,
    #065f46 100%
  );
  box-shadow:
    inset 0 0 20px rgba(0,0,0,0.6),
    inset 0 0 60px rgba(0,0,0,0.3),
    0 4px 20px rgba(0,0,0,0.4),
    0 0 0 1px rgba(52,211,153,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.record-label {
  width: var(--label-size);
  height: var(--label-size);
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #064e3b 0%, #022c22 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 15px rgba(0,0,0,0.5);
  flex-shrink: 0;
}

.record-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.record-hole {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--hole-size);
  height: var(--hole-size);
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #022c22, #011c15);
  box-shadow: inset 0 1px 3px rgba(52,211,153,0.06), 0 1px 2px rgba(0,0,0,0.6);
}
</style>
