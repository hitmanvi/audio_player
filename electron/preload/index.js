import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openAudioFile: () => ipcRenderer.invoke('open-audio-file'),
  openAudioFolder: () => ipcRenderer.invoke('open-audio-folder'),
  openLrcFile: () => ipcRenderer.invoke('open-lrc-file'),
  getAudioMetadata: (fileUrl) => ipcRenderer.invoke('get-audio-metadata', fileUrl),
  getFavoritesFolder: () => ipcRenderer.invoke('get-favorites-folder'),
  setFavoritesFolder: () => ipcRenderer.invoke('set-favorites-folder'),
  addToFavorites: (fileUrl) => ipcRenderer.invoke('add-to-favorites', fileUrl),
  getFavoritesList: () => ipcRenderer.invoke('get-favorites-list'),
  removeFromFavorites: (fileUrl) => ipcRenderer.invoke('remove-from-favorites', fileUrl),
})
