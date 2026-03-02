import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openAudioFile: () => ipcRenderer.invoke('open-audio-file'),
  openAudioFolder: () => ipcRenderer.invoke('open-audio-folder'),
})
