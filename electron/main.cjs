const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Set application name
app.setName('Medical Secret File');

let mainWindow = null;

function createWindow() {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, '../build/icon.ico')
    : path.join(__dirname, '../build/icon.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 640,
    title: 'Medical Secret File',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#151c2c',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allows local file:// fetch of offline exams/*.json
      allowRunningInsecureContent: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Application Menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Export Exam Data & History...',
          accelerator: 'CmdOrCtrl+S',
          click: async () => {
            if (!mainWindow) return;
            mainWindow.webContents.send('trigger-export-data');
          }
        },
        {
          label: 'Import Exam Data & History...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            if (!mainWindow) return;
            mainWindow.webContents.send('trigger-import-data');
          }
        },
        { type: 'separator' },
        {
          label: 'Print Exam / Result',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            if (mainWindow) mainWindow.webContents.print();
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', accelerator: 'CmdOrCtrl+R' },
        { role: 'forceReload', accelerator: 'CmdOrCtrl+Shift+R' },
        { type: 'separator' },
        { role: 'resetZoom', accelerator: 'CmdOrCtrl+0' },
        { role: 'zoomIn', accelerator: 'CmdOrCtrl+=' },
        { role: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
        { type: 'separator' },
        { role: 'togglefullscreen', accelerator: 'F11' }
      ]
    },
    {
      label: 'Exams',
      submenu: [
        {
          label: 'Return to Exam Hub',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('nav-exam-hub');
          }
        },
        {
          label: 'Toggle Dark / Light Theme',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('toggle-theme');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Medical Secret File',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Medical Secret File',
              message: 'Medical Secret File — Desktop Edition',
              detail: 'Version 1.0.0\n100% Offline Medical & Academic MCQ Preparation System.\n114 Complete Question Sets with 11,400+ verified MCQs, continuous question sheets, -0.25 negative marking, and performance analytics.\n\nAll data is stored locally on your chosen drive.',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Load the built app
  const distIndexPath = path.join(__dirname, '../dist/index.html');
  const rootIndexPath = path.join(__dirname, '../index.html');

  if (fs.existsSync(distIndexPath)) {
    mainWindow.loadFile(distIndexPath);
  } else if (fs.existsSync(rootIndexPath)) {
    mainWindow.loadFile(rootIndexPath);
  } else {
    mainWindow.loadURL('http://localhost:3000');
  }

  // Prevent opening external URLs inside the electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
