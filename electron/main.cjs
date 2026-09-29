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

        // 1. Root / Auth Portal Page
        if (reqUrl.pathname === '/' || reqUrl.pathname === '/auth') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Sign in to Medical Secret File</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
                <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
                <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
                <style>
                  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
                  body {
                    background: #0f172a;
                    color: #f8fafc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 20px;
                  }
                  .auth-card {
                    background: #1e293b;
                    border: 1px solid #334155;
                    padding: 40px 32px;
                    border-radius: 20px;
                    text-align: center;
                    max-width: 440px;
                    width: 100%;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                  }
                  .logo-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 58px;
                    height: 58px;
                    border-radius: 16px;
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    margin-bottom: 20px;
                    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
                  }
                  h1 { font-size: 1.4rem; font-weight: 800; margin-bottom: 8px; color: #f8fafc; }
                  p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin-bottom: 28px; }
                  .btn-google {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    background: #ffffff;
                    color: #0f172a;
                    border: none;
                    border-radius: 12px;
                    padding: 14px 20px;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                  }
                  .btn-google:hover {
                    background: #f1f5f9;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 18px rgba(255,255,255,0.15);
                  }
                  .btn-google:active { transform: translateY(0); }
                  .status-msg {
                    margin-top: 18px;
                    font-size: 0.9rem;
                    color: #60a5fa;
                    display: none;
                  }
                  .error-msg {
                    margin-top: 18px;
                    font-size: 0.88rem;
                    color: #f87171;
                    display: none;
                    background: rgba(239, 68, 68, 0.1);
                    padding: 10px 14px;
                    border-radius: 8px;
                    border: 1px solid rgba(239, 68, 68, 0.25);
                  }
                </style>
              </head>
              <body>
                <div class="auth-card">
                  <div class="logo-badge">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                  </div>
                  <h1>Medical Secret File</h1>
                  <p>Authorize your Google / Gmail account to sync your test rankings and score history with the desktop app.</p>
                  
                  <button id="btnGoogle" class="btn-google">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Sign in with Google / Gmail</span>
                  </button>

                  <div id="statusMsg" class="status-msg">Connecting to Google...</div>
                  <div id="errorMsg" class="error-msg"></div>
                </div>

                <script>
                  const firebaseConfig = {
                    apiKey: "AIzaSyCeOGW02mBVV5oQAWzh9scy1xULjwPg1Ek",
                    authDomain: "hazera-taju-degree-college.firebaseapp.com",
                    projectId: "hazera-taju-degree-college",
                    storageBucket: "hazera-taju-degree-college.firebasestorage.app",
                    messagingSenderId: "110273229891",
                    appId: "1:110273229891:web:28ca38967befe86a11d0f6",
                    measurementId: "G-W129JR3BTP"
                  };

                  firebase.initializeApp(firebaseConfig);
                  const auth = firebase.auth();
                  const provider = new firebase.auth.GoogleAuthProvider();

                  const btn = document.getElementById('btnGoogle');
                  const status = document.getElementById('statusMsg');
                  const errorEl = document.getElementById('errorMsg');

                  async function doLogin() {
                    btn.style.opacity = '0.6';
                    btn.disabled = true;
                    status.style.display = 'block';
                    errorEl.style.display = 'none';

                    try {
                      const result = await auth.signInWithPopup(provider);
                      const user = result.user;
                      const token = await user.getIdToken();

                      const payload = {
                        uid: user.uid,
                        displayName: user.displayName || 'Medical Candidate',
                        email: user.email || '',
                        photoURL: user.photoURL || ''
                      };

                      status.textContent = 'Transferring authentication to desktop app...';

                      await fetch('/callback', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user: payload, token: token })
                      });

                      window.location.href = '/success';
                    } catch (err) {
                      console.error(err);
                      btn.style.opacity = '1';
                      btn.disabled = false;
                      status.style.display = 'none';
                      errorEl.textContent = err.message || 'Authentication failed. Please try again.';
                      errorEl.style.display = 'block';
                    }
                  }

                  btn.addEventListener('click', doLogin);

                  // Auto-trigger on page open
                  setTimeout(doLogin, 400);
                </script>
              </body>
            </html>
          `);
          return;
        }

        // 2. Success Page
        if (reqUrl.pathname === '/success') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Signed In - Medical Secret File</title>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
                <style>
                  body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                  .card { background: #1e293b; padding: 3rem 2.5rem; border-radius: 1.25rem; text-align: center; max-width: 440px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); border: 1px solid #334155; }
                  .icon { width: 64px; height: 64px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); border: 2px solid #10b981; color: #10b981; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 20px; }
                  h2 { color: #f8fafc; margin-top: 0; font-size: 1.4rem; font-weight: 800; margin-bottom: 10px; }
                  p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; }
                </style>
              </head>
              <body>
                <div class="card">
                  <div class="icon">✓</div>
                  <h2>Authentication Successful!</h2>
                  <p>You have signed in to <strong>Medical Secret File</strong>.<br>You can now close this tab and return to the app.</p>
                </div>
                <script>setTimeout(() => { window.close(); }, 2000);</script>
              </body>
            </html>
          `);
          return;
        }

        // 3. Callback Handler (POST or GET)
        if (reqUrl.pathname === '/callback') {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const data = JSON.parse(body || '{}');
                const parsedUser = data.user;
                const tokenParam = data.token;

                if (mainWindow && parsedUser) {
                  mainWindow.webContents.send('browser-login-success', { user: parsedUser, token: tokenParam });
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true }));

                if (authServer) {
                  setTimeout(() => {
                    try { authServer.close(); } catch (e) {}
                    authServer = null;
                  }, 1500);
                }

                resolve({ success: true, user: parsedUser, token: tokenParam });
              } catch (e) {
                res.writeHead(400);
                res.end('Invalid JSON payload');
              }
            });
            return;
          } else {
            // GET Callback fallback
            const userParam = reqUrl.searchParams.get('user');
            const tokenParam = reqUrl.searchParams.get('token');
            let parsedUser = null;
            if (userParam) {
              try { parsedUser = JSON.parse(decodeURIComponent(userParam)); } catch (e) {}
            }

            if (mainWindow && parsedUser) {
              mainWindow.webContents.send('browser-login-success', { user: parsedUser, token: tokenParam });
            }

            res.writeHead(302, { 'Location': '/success' });
            res.end();

            if (authServer) {
              setTimeout(() => {
                try { authServer.close(); } catch (e) {}
                authServer = null;
              }, 1500);
            }

            resolve({ success: true, user: parsedUser, token: tokenParam });
            return;
          }
        }
      } catch (err) {
        console.error('Auth server error:', err);
      }

      res.writeHead(404);
      res.end();
    });

    authServer.listen(port, () => {
      const localAuthUrl = `http://localhost:${port}/`;
      shell.openExternal(localAuthUrl);
    });

    // Auto timeout after 3 minutes
    setTimeout(() => {
      if (authServer) {
        try { authServer.close(); } catch (e) {}
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
