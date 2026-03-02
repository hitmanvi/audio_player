<template>
  <div class="flex h-full overflow-hidden">
    <audio ref="audioEl" :src="currentBlobUrl" @loadedmetadata="onLoadedMetadata" @timeupdate="onTimeUpdate" @ended="onEnded" @play="isPlaying = true" @pause="isPlaying = false" />

    <!-- 播放列表 / 收藏 - 左侧独立区域 -->
    <aside
      class="shrink-0 flex flex-col border-r border-emerald-800/60 bg-emerald-950/50 transition-all duration-300 ease-in-out overflow-hidden"
      :class="playlistCollapsed ? 'w-0 min-w-0 border-r-0' : 'w-64'"
    >
      <div class="flex border-b border-emerald-800/50 shrink-0 w-64">
        <button
          type="button"
          class="flex-1 py-2 text-xs font-medium transition-colors"
          :class="leftPanelTab === 'playlist' ? 'bg-emerald-800/50 text-emerald-200' : 'text-emerald-500/80 hover:text-emerald-300'"
          @click="leftPanelTab = 'playlist'"
        >
          播放列表
        </button>
        <button
          v-if="cueTracks.length > 0"
          type="button"
          class="flex-1 py-2 text-xs font-medium transition-colors"
          :class="leftPanelTab === 'cue' ? 'bg-emerald-800/50 text-emerald-200' : 'text-emerald-500/80 hover:text-emerald-300'"
          @click="leftPanelTab = 'cue'"
        >
          曲目
        </button>
        <button
          type="button"
          class="flex-1 py-2 text-xs font-medium transition-colors"
          :class="leftPanelTab === 'favorites' ? 'bg-emerald-800/50 text-emerald-200' : 'text-emerald-500/80 hover:text-emerald-300'"
          @click="leftPanelTab = 'favorites'; loadFavorites()"
        >
          收藏
        </button>
      </div>
      <div class="playlist-scroll flex-1 min-h-0 overflow-y-auto w-64 shrink-0 py-2 px-2">
        <template v-if="leftPanelTab === 'playlist' && filteredPlaylist.length > 0">
          <button
            v-for="(entry, idx) in filteredPlaylist"
            :key="entry.item.url"
            type="button"
            class="w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition-all duration-200 flex items-center gap-3 group"
            :class="entry.originalIndex === currentIndex ? 'bg-emerald-500/25 text-emerald-200 shadow-sm' : 'text-emerald-400/70 hover:bg-emerald-800/30 hover:text-emerald-300'"
            @click="playTrack(entry.originalIndex)"
          >
            <span
              class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors"
              :class="entry.originalIndex === currentIndex ? 'bg-emerald-500/40 text-emerald-200' : 'bg-emerald-800/50 text-emerald-500/80 group-hover:bg-emerald-700/50'"
            >
              <svg v-if="entry.originalIndex === currentIndex && isPlaying" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
              <template v-else>{{ idx + 1 }}</template>
            </span>
            <span class="truncate flex-1 min-w-0">{{ stripExt(entry.item.name) }}</span>
          </button>
        </template>
        <template v-else-if="leftPanelTab === 'cue' && cueTracks.length > 0">
          <button
            v-for="(track, idx) in cueTracks"
            :key="idx"
            type="button"
            class="w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition-all duration-200 flex items-center gap-3 group"
            :class="idx === currentCueIndex ? 'bg-emerald-500/25 text-emerald-200 shadow-sm' : 'text-emerald-400/70 hover:bg-emerald-800/30 hover:text-emerald-300'"
            @click="seekToCueTrack(idx)"
          >
            <span
              class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors"
              :class="idx === currentCueIndex ? 'bg-emerald-500/40 text-emerald-200' : 'bg-emerald-800/50 text-emerald-500/80 group-hover:bg-emerald-700/50'"
            >
              <svg v-if="idx === currentCueIndex && isPlaying" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
              <template v-else>{{ String(track.number).padStart(2, '0') }}</template>
            </span>
            <span class="truncate flex-1 min-w-0">{{ track.title }}</span>
            <span v-if="track.performer" class="shrink-0 text-xs text-emerald-600 truncate max-w-[80px]">{{ track.performer }}</span>
          </button>
        </template>
        <template v-else-if="leftPanelTab === 'favorites' && favorites.length > 0">
          <div
            v-for="(item, idx) in favorites"
            :key="item.url"
            class="group/item w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-200"
            :class="currentSrc === item.url ? 'bg-emerald-500/25' : 'hover:bg-emerald-800/30'"
          >
            <button
              type="button"
              class="flex-1 min-w-0 flex items-center gap-3 text-left truncate"
              :class="currentSrc === item.url ? 'text-emerald-200' : 'text-emerald-400/70 group-hover/item:text-emerald-300'"
              @click="playFromFavorites(item)"
            >
              <span class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-emerald-500/80 bg-emerald-800/50">
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </span>
              <span class="truncate flex-1 min-w-0">{{ stripExt(item.name) }}</span>
            </button>
            <button
              type="button"
              class="shrink-0 p-1 rounded text-emerald-500/50 hover:text-red-400 hover:bg-red-500/20 transition-colors"
              title="取消收藏"
              @click.stop="removeFromFavorites(item)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </template>
        <div v-else class="flex flex-col items-center justify-center py-12 px-4 text-center">
          <svg class="w-12 h-12 text-emerald-700/60 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 6l12-3M9 6v13"/>
          </svg>
          <p class="text-emerald-500/80 text-sm">
            {{ leftPanelTab === 'cue' ? '当前文件无 CUE 曲目' : leftPanelTab === 'favorites' ? (favoritesFolder ? '暂无收藏' : '请先设置收藏文件夹') : (playlist.length > 0 ? '无匹配结果' : '暂无曲目') }}
          </p>
          <p v-if="leftPanelTab === 'playlist' && playlist.length === 0" class="text-emerald-600/70 text-xs mt-1">打开文件或文件夹添加</p>
          <p v-if="leftPanelTab === 'favorites' && !favoritesFolder" class="text-emerald-600/70 text-xs mt-1">点击下方文件夹图标设置</p>
        </div>
      </div>
      <div class="flex flex-col gap-2 px-3 py-2.5 border-t border-emerald-800/50 shrink-0 w-64">
        <p class="text-xs text-emerald-500/80 truncate">
          <template v-if="leftPanelTab === 'playlist'">
            <template v-if="playlist.length > 0">
              <span v-if="playlistSearchQuery.trim()">匹配 {{ filteredPlaylist.length }} 首</span>
              <span v-else>共 {{ playlist.length }} 首</span>
              <template v-if="currentIndex >= 0 && currentIndex < playlist.length">
                <span class="text-emerald-600/60 mx-1">·</span>
                <span class="text-emerald-400/90">第 {{ currentIndex + 1 }} 首</span>
              </template>
            </template>
            <span v-else>暂无曲目</span>
          </template>
          <template v-else-if="leftPanelTab === 'cue'">
            <span v-if="cueTracks.length > 0">共 {{ cueTracks.length }} 曲</span>
            <template v-if="currentCueIndex >= 0">
              <span class="text-emerald-600/60 mx-1">·</span>
              <span class="text-emerald-400/90">第 {{ currentCueIndex + 1 }} 曲</span>
            </template>
          </template>
          <template v-else>
            <span v-if="favoritesFolder">共 {{ favorites.length }} 首</span>
            <span v-else>未设置收藏文件夹</span>
          </template>
        </p>
        <div v-if="leftPanelTab === 'playlist'" class="w-full">
          <input
            v-model="playlistSearchQuery"
            type="text"
            placeholder="搜索曲目..."
            class="w-full px-3 py-1.5 text-sm rounded-lg bg-emerald-900/50 border border-emerald-800/50 text-emerald-200 placeholder-emerald-600 focus:outline-none focus:border-emerald-600"
          />
        </div>
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1">
            <template v-if="leftPanelTab === 'playlist'">
              <button
                type="button"
                class="p-2 rounded-lg text-emerald-500/80 hover:text-emerald-300 hover:bg-emerald-800/40 transition-colors"
                title="打开文件"
                @click="openFile"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
              </button>
              <button
                type="button"
                class="p-2 rounded-lg text-emerald-500/80 hover:text-emerald-300 hover:bg-emerald-800/40 transition-colors"
                title="打开文件夹"
                @click="openFolder"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                </svg>
              </button>
            </template>
            <template v-else>
              <button
                type="button"
                class="p-2 rounded-lg text-emerald-500/80 hover:text-emerald-300 hover:bg-emerald-800/40 transition-colors"
                title="设置收藏文件夹"
                @click="setFavoritesFolder"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                </svg>
              </button>
            </template>
          </div>
          <button
            type="button"
            class="p-1.5 rounded-md text-emerald-500/80 hover:text-emerald-300 hover:bg-emerald-800/40 transition-colors"
            title="收起"
            @click="playlistCollapsed = true"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
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

      <!-- 控制区：元信息 + 按钮 + 进度条 -->
      <div class="w-full max-w-sm mt-auto pt-3 border-t border-emerald-800/50 flex flex-col gap-3">
        <div class="text-center px-2 min-h-[2.5rem]">
          <p class="text-emerald-300 text-sm font-medium truncate">{{ currentTrackTitle || '未选择音频文件' }}</p>
          <p v-if="currentTrackSubtitle" class="text-emerald-500/80 text-xs truncate">{{ currentTrackSubtitle }}</p>
        </div>
        <div class="flex items-center justify-center gap-2 flex-wrap">
          <button
            type="button"
            class="btn-control"
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
            class="btn-control"
            title="上一曲"
            :disabled="!canPrev"
            @click="playPrev"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          <button
            type="button"
            class="btn-control btn-control--primary"
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
          <button
            type="button"
            class="btn-control"
            title="下一曲"
            :disabled="!canNext"
            @click="playNext"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z"/>
            </svg>
          </button>
          <div ref="volumeControlRef" class="relative flex items-center">
            <button
              type="button"
              class="btn-control"
              :class="volumeControlVisible ? 'btn-control--active' : ''"
              title="音量"
              @click="volumeControlVisible = !volumeControlVisible"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
            </button>
            <Transition name="fade">
              <div
                v-show="volumeControlVisible"
                class="volume-popover absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex items-center justify-center rounded-lg bg-emerald-900/90 border border-emerald-800/50 shadow-lg"
              >
                <div class="volume-slider-wrap">
                  <input
                    v-model.number="volume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    class="volume-slider-vertical"
                    @click.stop
                  />
                </div>
              </div>
            </Transition>
          </div>
          <button
            type="button"
            class="btn-control"
            :title="isCurrentInFavorites ? '取消收藏' : '添加到收藏'"
            :disabled="!currentBlobUrl || !currentSrc?.startsWith('local-file://')"
            @click="toggleFavorite"
          >
            <svg
              class="w-5 h-5"
              :class="isCurrentInFavorites ? 'fill-current text-red-400' : 'fill-none'"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
          <button
            type="button"
            class="btn-control"
            title="使用说明"
            @click="showHelp = true"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </button>
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

    <!-- 说明弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showHelp"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/90"
          @click.self="showHelp = false"
        >
          <div class="bg-emerald-900 border border-emerald-700 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-emerald-700">
              <h2 class="text-lg font-medium text-emerald-200">使用说明</h2>
              <button
                type="button"
                class="p-1 rounded-lg text-emerald-400 hover:text-emerald-200 hover:bg-emerald-800 transition-colors"
                @click="showHelp = false"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="px-6 py-4 overflow-y-auto text-sm text-emerald-300 space-y-4">
              <p><strong class="text-emerald-200">打开文件</strong>：点击文件图标，选择单个音频文件播放。</p>
              <p><strong class="text-emerald-200">打开文件夹</strong>：点击文件夹图标，选择目录后自动加载其中所有音频文件（含子目录），并生成播放列表。</p>
              <p><strong class="text-emerald-200">播放/暂停</strong>：点击中央绿色按钮。</p>
              <p><strong class="text-emerald-200">唱片/歌词</strong>：点击图标切换唱片封面或歌词显示。</p>
              <p><strong class="text-emerald-200">进度条</strong>：可拖动跳转到指定位置。</p>
              <p><strong class="text-emerald-200">音量</strong>：右侧滑块调节音量大小。</p>
              <p><strong class="text-emerald-200">播放列表</strong>：加载文件夹后显示，点击曲目可切换播放；当前曲目结束后自动播放下一首。</p>
              <p><strong class="text-emerald-200">收藏</strong>：点击心形按钮将当前曲目复制到收藏文件夹；需先设置收藏文件夹。</p>
              <p><strong class="text-emerald-200">CUE 曲目</strong>：整轨专辑（单文件多曲目）若附带同名 .cue 文件，会显示「曲目」列表，可点击跳转、上一曲/下一曲在曲目间切换。</p>
              <p class="pt-2 border-t border-emerald-700 text-emerald-400">
                <strong class="text-emerald-300">支持格式</strong>：MP3、WAV、OGG、M4A、FLAC、AAC
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue'

// ---------- 播放状态 ----------
const audioEl = ref(null)
const currentSrc = ref('')
const currentFileName = ref('')
const currentBlobUrl = ref('')
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.8)
const progress = ref(0)
const coverBlobUrl = ref('')
const trackMetadata = ref(null)

// ---------- 播放列表 ----------
const playlist = ref([])
const currentIndex = ref(-1)
const cueTracks = ref([])

// ---------- 收藏 ----------
const favorites = ref([])
const favoritesFolder = ref(null)
const currentFavoritesIndex = ref(-1)

// ---------- 歌词 ----------
const lyrics = ref([])
const currentLyricIndex = ref(-1)
const lyricsLoaded = ref(false)
const lyricsContainer = ref(null)

// ---------- UI 状态 ----------
const playlistCollapsed = ref(false)
const leftPanelTab = ref('playlist')
const showLyrics = ref(false)
const showHelp = ref(false)
const playlistSearchQuery = ref('')
const volumeControlVisible = ref(false)
const volumeControlRef = ref(null)

let volumeClickOutsideHandler
onMounted(async () => {
  volumeClickOutsideHandler = (e) => {
    if (volumeControlVisible.value && volumeControlRef.value && !volumeControlRef.value.contains(e.target)) {
      volumeControlVisible.value = false
    }
  }
  document.addEventListener('click', volumeClickOutsideHandler)
  if (window.electronAPI?.getFavoritesFolder) {
    favoritesFolder.value = await window.electronAPI.getFavoritesFolder()
  }
})
onUnmounted(() => {
  if (volumeClickOutsideHandler) document.removeEventListener('click', volumeClickOutsideHandler)
})

// ---------- 工具函数 ----------
const getFileName = (url) => {
  try {
    return decodeURIComponent(url.split('/').pop() || url.split('\\').pop() || '音频文件')
  } catch {
    return '音频文件'
  }
}
const stripExt = (name) => name.replace(/\.[^.]+$/, '') || name

// ---------- 计算属性 ----------
const filteredPlaylist = computed(() => {
  const q = playlistSearchQuery.value.trim().toLowerCase()
  if (!q) return playlist.value.map((item, i) => ({ item, originalIndex: i }))
  return playlist.value
    .map((item, i) => ({ item, originalIndex: i }))
    .filter(({ item }) => item.name.toLowerCase().includes(q))
})

const isCurrentInFavorites = computed(() =>
  currentSrc.value && favorites.value.some((f) => getFileName(f.url) === getFileName(currentSrc.value))
)

const loadFavorites = async () => {
  if (!window.electronAPI?.getFavoritesList) return
  favorites.value = await window.electronAPI.getFavoritesList()
  const folder = await window.electronAPI.getFavoritesFolder()
  favoritesFolder.value = folder
}

const setFavoritesFolder = async () => {
  if (!window.electronAPI?.setFavoritesFolder) return
  const folder = await window.electronAPI.setFavoritesFolder()
  if (folder) {
    favoritesFolder.value = folder
    await loadFavorites()
  }
}

const currentCueIndex = computed(() => {
  const tracks = cueTracks.value
  const t = currentTime.value
  if (!tracks.length || !isFinite(t)) return -1
  for (let i = tracks.length - 1; i >= 0; i--) {
    if (t >= tracks[i].start) return i
  }
  return 0
})

const canPrev = computed(() => {
  if (cueTracks.value.length && currentCueIndex.value > 0) return true
  if (currentFavoritesIndex.value >= 0) return currentFavoritesIndex.value > 0
  return playlist.value.length > 0 && currentIndex.value > 0
})

const canNext = computed(() => {
  if (cueTracks.value.length && currentCueIndex.value >= 0 && currentCueIndex.value < cueTracks.value.length - 1) return true
  if (currentFavoritesIndex.value >= 0) return currentFavoritesIndex.value < favorites.value.length - 1
  return playlist.value.length > 0 && currentIndex.value < playlist.value.length - 1
})

const currentTrackTitle = computed(() => {
  if (cueTracks.value.length && currentCueIndex.value >= 0) {
    return cueTracks.value[currentCueIndex.value]?.title || currentFileName.value
  }
  return trackMetadata.value?.title || currentFileName.value
})

const currentTrackSubtitle = computed(() => {
  if (cueTracks.value.length && currentCueIndex.value >= 0) {
    const parts = [cueTracks.value[currentCueIndex.value]?.performer, trackMetadata.value?.album].filter(Boolean)
    return parts.length ? parts.join(' · ') : stripExt(currentFileName.value)
  }
  return [trackMetadata.value?.artist, trackMetadata.value?.album].filter(Boolean).join(' · ') || ''
})

// ---------- 收藏 ----------
const playFromFavorites = async (item) => {
  const idx = favorites.value.findIndex((f) => f.url === item.url)
  currentFavoritesIndex.value = idx >= 0 ? idx : -1
  currentIndex.value = -1
  await loadTrack(item.url, item.coverUrl, item.lrcUrl)
  isPlaying.value = true
  audioEl.value?.play()
}

// ---------- CUE 曲目 ----------
const seekToCueTrack = (idx) => {
  const track = cueTracks.value[idx]
  if (!track || !audioEl.value) return
  audioEl.value.currentTime = track.start
  currentTime.value = track.start
  progress.value = track.start
}

// ---------- 播放控制 ----------
const playPrev = async () => {
  if (cueTracks.value.length && currentCueIndex.value > 0) {
    seekToCueTrack(currentCueIndex.value - 1)
    return
  }
  if (currentFavoritesIndex.value > 0) {
    const idx = currentFavoritesIndex.value - 1
    currentFavoritesIndex.value = idx
    const item = favorites.value[idx]
    await loadTrack(item.url, item.coverUrl, item.lrcUrl)
    isPlaying.value = true
    audioEl.value?.play()
  } else if (playlist.value.length > 0 && currentIndex.value > 0) {
    await playTrack(currentIndex.value - 1)
  }
}

const playNext = async () => {
  if (cueTracks.value.length && currentCueIndex.value >= 0 && currentCueIndex.value < cueTracks.value.length - 1) {
    seekToCueTrack(currentCueIndex.value + 1)
    return
  }
  if (currentFavoritesIndex.value >= 0 && currentFavoritesIndex.value < favorites.value.length - 1) {
    const idx = currentFavoritesIndex.value + 1
    currentFavoritesIndex.value = idx
    const item = favorites.value[idx]
    await loadTrack(item.url, item.coverUrl, item.lrcUrl)
    isPlaying.value = true
    audioEl.value?.play()
  } else if (playlist.value.length > 0 && currentIndex.value < playlist.value.length - 1) {
    await playTrack(currentIndex.value + 1)
  }
}

const toggleFavorite = async () => {
  if (!currentSrc.value?.startsWith('local-file://')) return
  if (isCurrentInFavorites.value) {
    const item = favorites.value.find((f) => getFileName(f.url) === getFileName(currentSrc.value))
    if (item) await removeFromFavorites(item)
  } else {
    if (!window.electronAPI?.addToFavorites) return
    const result = await window.electronAPI.addToFavorites(currentSrc.value)
    if (result?.ok) await loadFavorites()
    else if (result?.error) alert(result.error)
  }
}

const removeFromFavorites = async (item) => {
  if (!window.electronAPI?.removeFromFavorites) return
  const result = await window.electronAPI.removeFromFavorites(item.url)
  if (result?.ok) {
    await loadFavorites()
  } else if (result?.error) {
    alert(result.error)
  }
}

// ---------- 歌词 ----------
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

// ---------- 加载 ----------
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
  trackMetadata.value = null
  cueTracks.value = []
  if (currentBlobUrl.value) {
    URL.revokeObjectURL(currentBlobUrl.value)
    currentBlobUrl.value = ''
  }
  currentSrc.value = url
  currentFileName.value = getFileName(url)
  progress.value = 0
  currentTime.value = 0
  duration.value = 0
  if (coverBlobUrl.value) {
    if (coverBlobUrl.value.startsWith('blob:')) URL.revokeObjectURL(coverBlobUrl.value)
    coverBlobUrl.value = ''
  }
  if (url && url.startsWith('local-file://')) {
    try {
      const meta = await window.electronAPI?.getAudioMetadata?.(url)
      if (meta) {
        trackMetadata.value = meta
        if (meta.picture) {
          coverBlobUrl.value = meta.picture
        } else if (coverUrl) {
          await loadCover(coverUrl)
        }
      } else if (coverUrl) {
        await loadCover(coverUrl)
      }
    } catch (_) {
      if (coverUrl) await loadCover(coverUrl)
    }
    try {
      const tracks = await window.electronAPI?.getCueTracks?.(url)
      if (tracks?.length) {
        cueTracks.value = tracks
        leftPanelTab.value = 'cue'
      }
    } catch (_) {}
  } else if (coverUrl) {
    await loadCover(coverUrl)
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
  currentFavoritesIndex.value = -1
  currentIndex.value = idx
  const item = playlist.value[idx]
  await loadTrack(item.url, item.coverUrl, item.lrcUrl)
  isPlaying.value = true
  audioEl.value?.play()
}

// ---------- 文件操作 ----------
const openFile = async () => {
  if (!window.electronAPI?.openAudioFile) return
  const result = await window.electronAPI.openAudioFile()
  if (result?.url) {
    currentFavoritesIndex.value = -1
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
    currentFavoritesIndex.value = -1
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

// ---------- 事件 ----------
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
  if (currentFavoritesIndex.value >= 0 && currentFavoritesIndex.value < favorites.value.length - 1) {
    const idx = currentFavoritesIndex.value + 1
    currentFavoritesIndex.value = idx
    const item = favorites.value[idx]
    loadTrack(item.url, item.coverUrl, item.lrcUrl).then(() => {
      isPlaying.value = true
      audioEl.value?.play()
    })
  } else if (playlist.value.length > 0 && currentIndex.value < playlist.value.length - 1) {
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.btn-control {
  padding: 0.625rem;
  border-radius: 9999px;
  transition: color 0.2s, background-color 0.2s;
  background-color: rgb(6 95 70 / 0.6);
  color: rgb(110 231 183);
}
.btn-control:hover {
  background-color: rgb(4 120 87 / 0.6);
  color: rgb(167 243 208);
}
.btn-control:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-control:disabled:hover {
  background-color: rgb(6 95 70 / 0.6);
  color: rgb(110 231 183);
}
.btn-control--primary {
  background-color: rgb(52 211 153);
  color: rgb(2 44 34);
}
.btn-control--primary:hover {
  background-color: rgb(74 222 128);
}
.btn-control--primary:disabled {
  opacity: 0.5;
}
.btn-control--active {
  background-color: rgb(4 120 87 / 0.6);
  color: rgb(167 243 208);
}

.volume-popover {
  padding: 16px 12px;
}

.volume-slider-wrap {
  position: relative;
  width: 6px;
  height: 100px;
}

.volume-slider-vertical {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100px;
  height: 6px;
  margin-left: -50px;
  margin-top: -3px;
  transform: rotate(-90deg);
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  border-radius: 9999px;
}
.volume-slider-vertical::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 9999px;
  background: #065f46;
}
.volume-slider-vertical::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  margin-top: -4px;
  border-radius: 50%;
  background: #34d399;
  cursor: pointer;
}
.volume-slider-vertical::-moz-range-track {
  height: 6px;
  border-radius: 9999px;
  background: #065f46;
}
.volume-slider-vertical::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #34d399;
  cursor: pointer;
  border: none;
}
</style>
