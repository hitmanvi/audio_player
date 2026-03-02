# Audio Player

基于 Electron + Vue + Tailwind CSS 的多功能音频播放器。

## 开发

```bash
cnpm install
cnpm run dev
```

## 构建

```bash
cnpm run build
cnpm start
```

## Roadmap

可能的新功能：

- **播放控制**：单曲循环、列表循环、随机播放
- **快捷键**：全局快捷键（播放/暂停、上一曲/下一曲、音量）
- **系统托盘**：最小化到托盘、托盘控制
- **主题**：亮色 / 暗色切换
- **均衡器**：预设或自定义 EQ
- **桌面歌词**：独立窗口显示歌词
- **双语歌词**：同时显示原文与翻译
- **播放历史**：最近播放记录
- **收藏 / 歌单**：本地歌单管理
- **播放列表**：拖拽排序、删除单曲
- **播放列表导入导出**：M3U 等格式
- **音频可视化**：频谱 / 波形动画
- **歌词编辑**：在线编辑 LRC 并保存

## 项目结构

```
audio_player/
├── electron/
│   ├── main/index.js     # 主进程
│   └── preload/index.js # 预加载脚本
├── src/
│   ├── components/       # Vue 组件
│   │   └── AudioPlayer.vue
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── index.html
├── vite.config.js
└── package.json
```
