'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs/promises');

/**
 * My Kanban desktop shell.
 *
 * The Angular app is built with `ng build --configuration desktop` (see
 * angular.json) into dist/frontend/browser and loaded here from the file
 * system. The renderer detects the Electron bridge (`window.api`) and switches
 * every repository port to the local veneer, so no HTTP backend or server is
 * involved at runtime.
 *
 * PERSISTENCE DESIGN (divergence from the earlier SQLite idea): the whole
 * LocalDatabase is serialized into a single JSON snapshot stored under the app
 * user data folder. This mirrors the single-record contract of the IndexedDB
 * driver used by the web app, keeps this shell dependency-free, and makes the
 * file trivially inspectable and backup-able.
 */

function snapshotFile() {
  return path.join(app.getPath('userData'), 'my-kanban-snapshot.json');
}

function registerSnapshotHandlers() {
  ipcMain.handle('snapshot:load', async () => {
    try {
      const raw = await fs.readFile(snapshotFile(), 'utf8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  ipcMain.handle('snapshot:save', async (_event, snapshot) => {
    await fs.mkdir(app.getPath('userData'), { recursive: true });
    await fs.writeFile(snapshotFile(), JSON.stringify(snapshot, null, 2), 'utf8');
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const htmlPath = path.join(__dirname, '..', 'dist', 'frontend', 'browser', 'index.html');
  win.loadFile(htmlPath);
}

app.whenReady().then(() => {
  registerSnapshotHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});