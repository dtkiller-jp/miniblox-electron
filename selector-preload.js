const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  launchGame: (data) => ipcRenderer.invoke('launch-game', data),
  fetchScript: (url) => ipcRenderer.invoke('fetch-script', url),
  importProfile: (source) => ipcRenderer.invoke('import-profile', source),
  deleteGame: (gameId) => ipcRenderer.invoke('delete-game', gameId),
  exportProfile: (gameId, profileId) => ipcRenderer.invoke('export-profile', gameId, profileId)
});
