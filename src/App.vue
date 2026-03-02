<template>
  <div class="h-screen bg-emerald-950 text-emerald-100 flex flex-col overflow-hidden">
    <!-- 顶部栏 -->
    <header class="shrink-0 flex items-center justify-between px-4 py-2 border-b border-emerald-900">
      <h1 class="text-sm font-medium tracking-wider text-emerald-400">AUDIO PLAYER</h1>
      <button
        type="button"
        class="p-1.5 rounded text-emerald-500 hover:text-emerald-300 hover:bg-emerald-900/50 transition-colors"
        title="使用说明"
        @click="showHelp = true"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </button>
    </header>
    <AudioPlayer class="flex-1 min-h-0" />

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
              <p><strong class="text-emerald-200">进度条</strong>：可拖动跳转到指定位置。</p>
              <p><strong class="text-emerald-200">音量</strong>：右侧滑块调节音量大小。</p>
              <p><strong class="text-emerald-200">播放列表</strong>：加载文件夹后显示，点击曲目可切换播放；当前曲目结束后自动播放下一首。</p>
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
import { ref } from 'vue'
import AudioPlayer from './components/AudioPlayer.vue'

const showHelp = ref(false)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
