import { app, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { TextDecoder } from 'node:util'
import { parseFile, selectCover } from 'music-metadata'

// ========== 常量 ==========
const AUDIO_EXT = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'])
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'])
const COVER_NAMES = ['cover', 'folder', 'album', 'front', 'artwork', 'albumart', '.folder']
const MIME_TYPES = {
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4', '.flac': 'audio/flac', '.aac': 'audio/aac',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
  '.lrc': 'text/plain; charset=utf-8',
}

// ========== 工具函数 ==========
function toLocalFileUrl(filePath) {
  return pathToFileURL(path.resolve(filePath)).href.replace(/^file:\/\//, 'local-file://')
}

function fromLocalFileUrl(fileUrl) {
  return fileURLToPath(fileUrl.replace(/^local-file:/, 'file:'))
}

/** 解码文本，优先 UTF-8，失败则尝试 GBK（LRC/CUE 常见中文编码） */
function decodeTextBuffer(buf) {
  try {
    const utf8 = new TextDecoder('utf-8', { fatal: true }).decode(buf)
    if (!utf8.includes('\uFFFD')) return utf8
  } catch (_) {}
  try {
    return new TextDecoder('gbk').decode(buf)
  } catch (_) {}
  return new TextDecoder('utf-8', { fatal: false }).decode(buf)
}

/** 在音频同目录查找同名文件（扩展名） */
function findSidecarFile(audioPath, ext) {
  const dir = path.dirname(audioPath)
  const base = path.basename(audioPath, path.extname(audioPath))
  const sidecarPath = path.join(dir, `${base}${ext}`)
  try {
    return fs.existsSync(sidecarPath) ? sidecarPath : null
  } catch (err) {
    console.error(`findSidecarFile ${ext} error:`, err)
    return null
  }
}

const findLrcForFile = (p) => findSidecarFile(p, '.lrc')
const findCueForFile = (p) => findSidecarFile(p, '.cue')

protocol.registerSchemesAsPrivileged([
  { scheme: 'local-file', privileges: { bypassCSP: true, supportFetchAPI: true } },
])

// ========== CUE 解析 ==========
function cueTimeToSeconds(msf) {
  const parts = String(msf).trim().split(':')
  if (parts.length < 3) return 0
  const m = parseInt(parts[0], 10) || 0
  const s = parseInt(parts[1], 10) || 0
  const f = parseInt(parts[2], 10) || 0
  return m * 60 + s + f / 75
}

/** 解析 CUE 文件，返回 [{ number, title, performer, start, end }]（仅取第一个 FILE 块） */
function parseCueFile(cuePath) {
  try {
    const text = decodeTextBuffer(fs.readFileSync(cuePath))
    const lines = text.split(/\r?\n/)
    const tracks = []
    let currentTrack = null
    let filePerformer = ''
    let fileTitle = ''
    let inFirstFile = false

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const match = trimmed.match(/^(\w+)\s+(.+)$/)
      if (!match) continue
      const [, cmd, rest] = match
      const cmdUpper = cmd.toUpperCase()

      if (cmdUpper === 'FILE') {
        if (inFirstFile) {
          if (currentTrack) tracks.push(currentTrack)
          break
        }
        inFirstFile = true
      } else if (cmdUpper === 'TRACK' && inFirstFile) {
        if (currentTrack) tracks.push(currentTrack)
        const trackNum = parseInt(rest.split(/\s+/)[0], 10)
        currentTrack = {
          number: trackNum,
          title: fileTitle || `曲目 ${trackNum}`,
          performer: filePerformer,
          start: 0,
        }
      } else if (cmdUpper === 'TITLE') {
        const m = rest.match(/^"([^"]*)"$/)
        const val = m ? m[1] : rest.replace(/^"|"$/g, '')
        if (currentTrack) currentTrack.title = val
        else fileTitle = val
      } else if (cmdUpper === 'PERFORMER') {
        const m = rest.match(/^"([^"]*)"$/)
        const val = m ? m[1] : rest.replace(/^"|"$/g, '')
        if (currentTrack) currentTrack.performer = val
        else filePerformer = val
      } else if (cmdUpper === 'INDEX' && currentTrack) {
        const parts = rest.split(/\s+/)
        if (parts[0] === '01' && parts[1]) {
          currentTrack.start = cueTimeToSeconds(parts[1])
          tracks.push(currentTrack)
          currentTrack = null
        }
      }
    }
    if (currentTrack) tracks.push(currentTrack)

    for (let i = 0; i < tracks.length; i++) {
      tracks[i].end = i < tracks.length - 1 ? tracks[i + 1].start : Infinity
    }
    return tracks
  } catch (err) {
    console.error('parseCueFile error:', err)
    return []
  }
}

// ========== 文件系统 ==========
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
  return results.sort((a, b) =>
    path.basename(a).localeCompare(path.basename(b), undefined, { numeric: true })
  )
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '../..')

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json')

function loadConfig() {
  try {
    const data = fs.readFileSync(CONFIG_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    return {}
  }
}

function saveConfig(config) {
  try {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true })
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
  } catch (err) {
    console.error('saveConfig error:', err)
  }
}
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

// ========== IPC：文件与元数据 ==========
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

ipcMain.handle('get-cue-tracks', async (_, fileUrl) => {
  try {
    const filePath = fromLocalFileUrl(fileUrl)
    const cuePath = findCueForFile(filePath)
    if (!cuePath) return []
    return parseCueFile(cuePath)
  } catch (err) {
    console.error('get-cue-tracks error:', err)
    return []
  }
})

ipcMain.handle('get-audio-metadata', async (_, fileUrl) => {
  try {
    const filePath = fromLocalFileUrl(fileUrl)
    if (!fs.existsSync(filePath)) return null
    const metadata = await parseFile(filePath)
    const common = metadata.common || {}
    const picture = selectCover(common.picture) || common.picture?.[0]
    let pictureDataUrl = null
    if (picture?.data) {
      const base64 = Buffer.from(picture.data).toString('base64')
      const format = picture.format || 'image/jpeg'
      pictureDataUrl = `data:${format};base64,${base64}`
    }
    return {
      title: common.title,
      artist: common.artist,
      album: common.album,
      year: common.year,
      genre: common.genre?.[0],
      picture: pictureDataUrl,
    }
  } catch (err) {
    console.error('get-audio-metadata error:', err)
    return null
  }
})

// ========== IPC：收藏 ==========
ipcMain.handle('get-favorites-folder', async () => {
  const config = loadConfig()
  return config.favoritesFolder || null
})

ipcMain.handle('set-favorites-folder', async () => {
  const win = mainWindow ?? BrowserWindow.getFocusedWindow()
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory', 'createDirectory'],
    title: '选择收藏文件夹',
  })
  if (!result.canceled && result.filePaths.length > 0) {
    const folder = result.filePaths[0]
    const config = loadConfig()
    config.favoritesFolder = folder
    saveConfig(config)
    return folder
  }
  return null
})

ipcMain.handle('add-to-favorites', async (_, fileUrl) => {
  const config = loadConfig()
  const folder = config.favoritesFolder
  if (!folder || !fs.existsSync(folder)) {
    return { ok: false, error: '请先设置收藏文件夹' }
  }
  try {
    const filePath = fromLocalFileUrl(fileUrl)
    if (!fs.existsSync(filePath)) return { ok: false, error: '文件不存在' }
    const baseName = path.basename(filePath)
    let destPath = path.join(folder, baseName)
    let counter = 1
    while (fs.existsSync(destPath)) {
      const ext = path.extname(baseName)
      const nameWithoutExt = path.basename(baseName, ext)
      destPath = path.join(folder, `${nameWithoutExt}_${counter}${ext}`)
      counter++
    }
    fs.copyFileSync(filePath, destPath)
    const lrcPath = findLrcForFile(filePath)
    if (lrcPath && fs.existsSync(lrcPath)) {
      const lrcBase = path.basename(lrcPath)
      const lrcDest = path.join(folder, lrcBase)
      if (!fs.existsSync(lrcDest)) fs.copyFileSync(lrcPath, lrcDest)
    }
    return { ok: true, url: toLocalFileUrl(destPath) }
  } catch (err) {
    console.error('add-to-favorites error:', err)
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('get-favorites-list', async () => {
  const config = loadConfig()
  const folder = config.favoritesFolder
  if (!folder || !fs.existsSync(folder)) return []
  const paths = scanDirForAudio(folder)
  const coverPath = findCoverInDir(folder)
  return paths.map((p) => {
    const lrc = findLrcForFile(p)
    return {
      url: toLocalFileUrl(p),
      name: path.basename(p),
      coverUrl: coverPath ? toLocalFileUrl(coverPath) : null,
      lrcUrl: lrc ? toLocalFileUrl(lrc) : null,
    }
  })
})

ipcMain.handle('remove-from-favorites', async (_, fileUrl) => {
  try {
    const filePath = fromLocalFileUrl(fileUrl)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      const lrcPath = findLrcForFile(filePath)
      if (lrcPath && fs.existsSync(lrcPath)) fs.unlinkSync(lrcPath)
    }
    return { ok: true }
  } catch (err) {
    console.error('remove-from-favorites error:', err)
    return { ok: false, error: err.message }
  }
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
        const text = decodeTextBuffer(buf)
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
