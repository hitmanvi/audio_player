import { app, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

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
}

// 注册自定义协议，解决 http 页面加载 file:// 被阻止的问题
protocol.registerSchemesAsPrivileged([
  { scheme: 'local-file', privileges: { bypassCSP: true, supportFetchAPI: true } },
])

function toLocalFileUrl(filePath) {
  return pathToFileURL(path.resolve(filePath)).href.replace(/^file:\/\//, 'local-file://')
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
    return {
      url: toLocalFileUrl(filePath),
      coverUrl: coverPath ? toLocalFileUrl(coverPath) : null,
    }
  }
  return null
})

// 打开文件夹，返回 { urls, coverUrl }
ipcMain.handle('open-audio-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  })
  if (!result.canceled && result.filePaths.length > 0) {
    const rootPath = result.filePaths[0]
    const paths = scanDirForAudio(rootPath)
    const coverPath = findCoverInDir(rootPath)
    return {
      urls: paths.map((p) => toLocalFileUrl(p)),
      coverUrl: coverPath ? toLocalFileUrl(coverPath) : null,
    }
  }
  return null
})

app.whenReady().then(async () => {
  protocol.handle('local-file', async (request) => {
    const fileUrl = request.url.replace(/^local-file:/, 'file:')
    const response = await net.fetch(fileUrl)
    const pathname = new URL(fileUrl).pathname
    const ext = path.extname(decodeURIComponent(pathname)).toLowerCase()
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
