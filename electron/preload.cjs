const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  readExamJson: (name) => ipcRenderer.invoke('read-exam-json', name),
  startBrowserLogin: () => ipcRenderer.invoke('start-browser-login'),
  onBrowserLoginSuccess: (callback) => ipcRenderer.on('browser-login-success', (event, data) => callback(data)),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close')
});
