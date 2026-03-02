"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  openAudioFile: () => electron.ipcRenderer.invoke("open-audio-file"),
  openAudioFolder: () => electron.ipcRenderer.invoke("open-audio-folder"),
  openLrcFile: () => electron.ipcRenderer.invoke("open-lrc-file"),
  getAudioMetadata: (fileUrl) => electron.ipcRenderer.invoke("get-audio-metadata", fileUrl),
  getFavoritesFolder: () => electron.ipcRenderer.invoke("get-favorites-folder"),
  setFavoritesFolder: () => electron.ipcRenderer.invoke("set-favorites-folder"),
  addToFavorites: (fileUrl) => electron.ipcRenderer.invoke("add-to-favorites", fileUrl),
  getFavoritesList: () => electron.ipcRenderer.invoke("get-favorites-list"),
  removeFromFavorites: (fileUrl) => electron.ipcRenderer.invoke("remove-from-favorites", fileUrl)
});
