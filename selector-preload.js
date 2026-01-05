const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getVersions: () => ipcRenderer.invoke('get-versions'),
  updateVersions: (updateUrl) => ipcRenderer.invoke('update-versions', updateUrl),
  launchApp: (version) => ipcRenderer.invoke('launch-app', version)
});
