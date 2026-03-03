import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  addToFavorites: (fileUrl) => ipcRenderer.invoke('add-to-favorites', fileUrl),
  getAudioMetadata: (fileUrl) => ipcRenderer.invoke('get-audio-metadata', fileUrl),
  getCueTracks: (fileUrl) => ipcRenderer.invoke('get-cue-tracks', fileUrl),
  getFavoritesFolder: () => ipcRenderer.invoke('get-favorites-folder'),
  getFavoritesList: () => ipcRenderer.invoke('get-favorites-list'),
  openAudioFile: () => ipcRenderer.invoke('open-audio-file'),
  openAudioFolder: () => ipcRenderer.invoke('open-audio-folder'),
  openArtistFolder: () => ipcRenderer.invoke('open-artist-folder'),
  openLrcFile: () => ipcRenderer.invoke('open-lrc-file'),
  removeFromFavorites: (fileUrl) => ipcRenderer.invoke('remove-from-favorites', fileUrl),
  setFavoritesFolder: () => ipcRenderer.invoke('set-favorites-folder'),
})
