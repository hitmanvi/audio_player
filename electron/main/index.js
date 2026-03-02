import { app, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { TextDecoder } from 'node:util'

/** 解码 LRC 文本，优先 UTF-8，失败则尝试 GBK（常见于中文歌词） */
function decodeLrcBuffer(buf) {
  try {
    const utf8 = new TextDecoder('utf-8', { fatal: true }).decode(buf)
    if (!utf8.includes('\uFFFD')) return utf8
  } catch (_) {}
  try {
    return new TextDecoder('gbk').decode(buf)
  } catch (_) {}
  return new TextDecoder('utf-8', { fatal: false }).decode(buf)
}

const AUDIO_EXT = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'])
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'])
const COVER_NAMES = ['cover', 'folder', 'album', 'front', 'artwork', 'albumart', '.folder']

const MIME_TYPES = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.lrc': 'text/plain; charset=utf-8',
}

// 注册自定义协议，解决 http 页面加载 file:// 被阻止的问题
protocol.registerSchemesAsPrivileged([
  { scheme: 'local-file', privileges: { bypassCSP: true, supportFetchAPI: true } },
])

function toLocalFileUrl(filePath) {
  return pathToFileURL(path.resolve(filePath)).href.replace(/^file:\/\//, 'local-file://')
}

function findLrcForFile(audioPath) {
  const dir = path.dirname(audioPath)
  const base = path.basename(audioPath, path.extname(audioPath))
  const lrcPath = path.join(dir, `${base}.lrc`)
  try {
    if (fs.existsSync(lrcPath)) return lrcPath
  } catch (err) {
    console.error('findLrcForFile error:', err)
  }
  return null
}

function findCoverInDir(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const images = entries
      .filter((e) => e.isFile() && IMAGE_EXT.has(path.extname(e.name).toLowerCase()))
      .map((e) => ({ name: e.name, path: path.join(dirPath, e.name) }))
    for (const coverName of COVER_NAMES) {
      const target = coverName.toLowerCase()
      const found = images.find((e) => {
        const base = path.basename(e.name, path.extname(e.name)).toLowerCase()
        return base === target || base === target.replace(/^\./, '')
      })
      if (found) return found.path
    }
    if (images.length > 0) return images[0].path
  } catch (err) {
    console.error('findCoverInDir error:', err)
  }
  return null
}

function scanDirForAudio(dirPath) {
  const results = []
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        results.push(...scanDirForAudio(fullPath))
      } else if (entry.isFile() && AUDIO_EXT.has(path.extname(entry.name).toLowerCase())) {
        results.push(fullPath)
      }
    }
  } catch (err) {
    console.error('scanDirForAudio error:', err)
  }
  return results.sort()
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '../..')
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

let mainWindow = null

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 520,
    minWidth: 640,
    minHeight: 400,
    title: 'Audio Player',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    await mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 打开音频文件，返回 { url, coverUrl }
ipcMain.handle('open-audio-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: '音频文件', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'] },
      { name: '所有文件', extensions: ['*'] },
    ],
  })
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0]
    const dirPath = path.dirname(filePath)
    const coverPath = findCoverInDir(dirPath)
    const lrcPath = findLrcForFile(filePath)
    return {
      url: toLocalFileUrl(filePath),
      coverUrl: coverPath ? toLocalFileUrl(coverPath) : null,
      lrcUrl: lrcPath ? toLocalFileUrl(lrcPath) : null,
    }
  }
  return null
})

// 打开 LRC 歌词文件
ipcMain.handle('open-lrc-file', async () => {
  const win = mainWindow ?? BrowserWindow.getFocusedWindow()
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [{ name: 'LRC 歌词', extensions: ['lrc'] }],
  })
  if (!result.canceled && result.filePaths.length > 0) {
    return toLocalFileUrl(result.filePaths[0])
  }
  return null
})

// 打开文件夹，返回 { urls, coverUrl, lrcUrls }
ipcMain.handle('open-audio-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  })
  if (!result.canceled && result.filePaths.length > 0) {
    const rootPath = result.filePaths[0]
    const paths = scanDirForAudio(rootPath)
    const coverPath = findCoverInDir(rootPath)
    const lrcUrls = paths.map((p) => {
      const lrc = findLrcForFile(p)
      return lrc ? toLocalFileUrl(lrc) : null
    })
    return {
      urls: paths.map((p) => toLocalFileUrl(p)),
      coverUrl: coverPath ? toLocalFileUrl(coverPath) : null,
      lrcUrls,
    }
  }
  return null
})

app.whenReady().then(async () => {
  protocol.handle('local-file', async (request) => {
    const fileUrl = request.url.replace(/^local-file:/, 'file:')
    const filePath = fileURLToPath(fileUrl)
    const ext = path.extname(filePath).toLowerCase()

    // LRC 歌词：主进程读取并正确解码（支持 UTF-8 / GBK）
    if (ext === '.lrc') {
      try {
        const buf = fs.readFileSync(filePath)
        const text = decodeLrcBuffer(buf)
        return new Response(text, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      } catch (err) {
        console.error('read lrc error:', err)
        return new Response('', { status: 500 })
      }
    }

    const response = await net.fetch(fileUrl)
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream'
    return new Response(response.body, {
      status: response.status,
      headers: { 'Content-Type': mimeType },
    })
  })
  await createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
