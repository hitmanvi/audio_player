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
