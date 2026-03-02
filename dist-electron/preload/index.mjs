"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  addToFavorites: (fileUrl) => electron.ipcRenderer.invoke("add-to-favorites", fileUrl),
  getAudioMetadata: (fileUrl) => electron.ipcRenderer.invoke("get-audio-metadata", fileUrl),
  getCueTracks: (fileUrl) => electron.ipcRenderer.invoke("get-cue-tracks", fileUrl),
  getFavoritesFolder: () => electron.ipcRenderer.invoke("get-favorites-folder"),
  getFavoritesList: () => electron.ipcRenderer.invoke("get-favorites-list"),
  openAudioFile: () => electron.ipcRenderer.invoke("open-audio-file"),
  openAudioFolder: () => electron.ipcRenderer.invoke("open-audio-folder"),
  openLrcFile: () => electron.ipcRenderer.invoke("open-lrc-file"),
  removeFromFavorites: (fileUrl) => electron.ipcRenderer.invoke("remove-from-favorites", fileUrl),
  setFavoritesFolder: () => electron.ipcRenderer.invoke("set-favorites-folder")
});
