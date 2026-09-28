const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  onTriggerExport: (callback) => ipcRenderer.on('trigger-export-data', () => callback()),
  onTriggerImport: (callback) => ipcRenderer.on('trigger-import-data', () => callback()),
  onNavExamHub: (callback) => ipcRenderer.on('nav-exam-hub', () => callback()),
  onToggleTheme: (callback) => ipcRenderer.on('toggle-theme', () => callback())
});
