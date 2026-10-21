/**
 * M4ster Tracker — Electron desktop wrapper.
 *
 * Loads the production web app (https://m4ster-tracker.vercel.app/app) in a
 * native window. The bare origin is the marketing site; the app lives at /app. Handles the `m4ster-tracker://` deep-link scheme used by the
 * Google OAuth desktop flow and forwards deep-link URLs to the renderer.
 *
 * No Rust, no native toolchain — just Node.js + Electron.
 */

const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');

const APP_URL = process.env.M4STER_TRACKER_URL || 'https://m4ster-tracker.vercel.app/app';
const APP_ORIGIN = new URL(APP_URL).origin;
const PROTOCOL = 'm4ster-tracker';

let mainWindow = null;
let pendingDeepLink = null;

function isAppUrl(url) {
  try {
    return new URL(url).origin === APP_ORIGIN;
  } catch {
    return false;
  }
}

function forwardDeepLink(url) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('deep-link-url', url);
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  } else {
    pendingDeepLink = url;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#0a0a14',
    title: 'M4ster Tracker',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(APP_URL);

  // Keep navigation inside the app; open everything else in the system browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAppUrl(url)) return { action: 'allow' };
    if (url.startsWith(`${PROTOCOL}://`)) {
      forwardDeepLink(url);
      return { action: 'deny' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('did-finish-load', () => {
    if (pendingDeepLink) {
      const url = pendingDeepLink;
      pendingDeepLink = null;
      mainWindow.webContents.send('deep-link-url', url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Register the deep-link protocol (Google OAuth desktop callback).
if (!app.isDefaultProtocolClient(PROTOCOL)) {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

// Single instance: a second launch (e.g. via deep link) focuses the window.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  // Windows: deep links arrive as argv on the second instance.
  app.on('second-instance', (_event, argv) => {
    const url = argv.find((a) => a.startsWith(`${PROTOCOL}://`));
    if (url) forwardDeepLink(url);
    else if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // macOS: deep links arrive via open-url.
  app.on('open-url', (event, url) => {
    event.preventDefault();
    forwardDeepLink(url);
  });

  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

// Renderer can ask which deep link (if any) launched the app (cleared on read).
ipcMain.handle('get-pending-deep-link', () => {
  const url = pendingDeepLink;
  pendingDeepLink = null;
  return url;
});
