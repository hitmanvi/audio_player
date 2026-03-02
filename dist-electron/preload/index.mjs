"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  openAudioFile: () => electron.ipcRenderer.invoke("open-audio-file"),
  openAudioFolder: () => electron.ipcRenderer.invoke("open-audio-folder")
});
