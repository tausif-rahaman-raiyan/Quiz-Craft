const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Enable offline local file access for packaged Chromium
app.commandLine.appendSwitch('allow-file-access-from-files');
app.commandLine.appendSwitch('disable-web-security');

// Set application name
app.setName('Medical Secret File');

let mainWindow = null;
let authServer = null;

// Helper to resolve exam and catalog JSON files
function getExamJsonData(name) {
  try {
    const filename = name.endsWith('.json') ? name : `${name}.json`;
    const searchDirs = [
      path.join(__dirname, '../dist/exams', filename),
      path.join(__dirname, '../public/exams', filename),
      path.join(__dirname, '../exams', filename),
      path.join(app.getAppPath(), 'dist/exams', filename),
      path.join(app.getAppPath(), 'public/exams', filename),
      path.join(process.resourcesPath, 'app/dist/exams', filename),
      path.join(process.resourcesPath, 'dist/exams', filename),
      path.join(process.resourcesPath, 'exams', filename)
    ];

    for (const p of searchDirs) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        return JSON.parse(raw);
      }
    }
    console.warn(`Could not locate exam file: ${filename}`);
    return null;
  } catch (err) {
    console.error(`Error reading exam json ${name}:`, err);
    return null;
  }
}

// IPC handler for reading exam questions offline
ipcMain.handle('read-exam-json', async (event, name) => {
  return getExamJsonData(name);
});

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
    autoHideMenuBar: true, // Auto-hides top menu bar
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allows offline access to local json data
      allowRunningInsecureContent: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Completely remove top menu bar (File, View, Exams, Help)
  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);

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

  // Handle external links to open in system default browser (Chrome, Edge, etc.)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (authServer) {
      try { authServer.close(); } catch (e) {}
      authServer = null;
    }
  });
}

// IPC Handlers for Default Browser Google Authentication
ipcMain.handle('start-browser-login', async () => {
  return new Promise((resolve) => {
    if (authServer) {
      try { authServer.close(); } catch (e) {}
      authServer = null;
    }

    const port = 54321;
    authServer = http.createServer((req, res) => {
      try {
        const reqUrl = new URL(req.url, `http://localhost:${port}`);
        if (reqUrl.pathname === '/callback') {
          const userParam = reqUrl.searchParams.get('user');
          const tokenParam = reqUrl.searchParams.get('token');

          let parsedUser = null;
          if (userParam) {
            try {
              parsedUser = JSON.parse(decodeURIComponent(userParam));
            } catch (e) {
              console.error('Failed to parse user data:', e);
            }
          }

          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Signed In - Medical Secret File</title>
                <style>
                  body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                  .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; text-align: center; max-width: 420px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
                  h2 { color: #10b981; margin-top: 0; }
                  p { color: #94a3b8; font-size: 15px; line-height: 1.5; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h2>✓ Authentication Successful!</h2>
                  <p>You have signed in to <strong>Medical Secret File</strong>.<br>You can close this tab and return to the desktop application.</p>
                </div>
                <script>setTimeout(() => window.close(), 2500);</script>
              </body>
            </html>
          `);

          if (authServer) {
            authServer.close();
            authServer = null;
          }

          if (mainWindow) {
            mainWindow.webContents.send('browser-login-success', { user: parsedUser, token: tokenParam });
          }

          resolve({ success: true, user: parsedUser, token: tokenParam });
          return;
        }
      } catch (err) {
        console.error('Auth server error:', err);
      }

      res.writeHead(404);
      res.end();
    });

    authServer.listen(port, () => {
      // Open GitHub Pages auth bridge or local file in default system browser
      const bridgeUrl = `https://tausif-rahaman-raiyan.github.io/Quiz-Craft/auth-bridge.html?port=${port}`;
      shell.openExternal(bridgeUrl);
    });

    // Auto timeout after 3 minutes
    setTimeout(() => {
      if (authServer) {
        authServer.close();
        authServer = null;
        resolve({ success: false, error: 'Login timed out' });
      }
    }, 180000);
  });
});

// Window controls IPC
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-toggle-fullscreen', () => {
  if (mainWindow) {
    const isFull = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!isFull);
    mainWindow.webContents.send('fullscreen-changed', !isFull);
  }
});

ipcMain.handle('window-is-fullscreen', () => {
  return mainWindow ? mainWindow.isFullScreen() : false;
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

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
