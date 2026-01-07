const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onLoadingProgress: (callback) => {
    ipcRenderer.on('loading-progress', (_event, data) => callback(data));
  },
  onGameName: (callback) => {
    ipcRenderer.on('game-name', (_event, name) => callback(name));
  }
});
