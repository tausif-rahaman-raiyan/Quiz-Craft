const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  readExamJson: (name) => ipcRenderer.invoke('read-exam-json', name),
  startBrowserLogin: () => ipcRenderer.invoke('start-browser-login'),
  onBrowserLoginSuccess: (callback) => ipcRenderer.on('browser-login-success', (event, data) => callback(data)),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  toggleFullscreen: () => ipcRenderer.send('window-toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('window-is-fullscreen'),
  onFullscreenChanged: (callback) => ipcRenderer.on('fullscreen-changed', (event, data) => callback(data)),
  onTriggerExport: (callback) => ipcRenderer.on('trigger-export', () => callback()),
  onTriggerImport: (callback) => ipcRenderer.on('trigger-import', () => callback()),
  onNavExamHub: (callback) => ipcRenderer.on('nav-exam-hub', () => callback()),
  onToggleTheme: (callback) => ipcRenderer.on('toggle-theme', () => callback()),
  closeWindow: () => ipcRenderer.send('window-close')
});
