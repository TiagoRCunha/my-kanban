'use strict';

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Installs the `window.api` bridge the renderer expects in desktop mode.
 * Read more: src/app/infrastructure/local/storage/desktop-storage-bridge.ts
 *
 * Contract:
 *   loadSnapshot(): Promise<LocalDatabaseSnapshot | null>
 *   saveSnapshot(snapshot: LocalDatabaseSnapshot): Promise<void>
 */
contextBridge.exposeInMainWorld('api', {
  loadSnapshot: () => ipcRenderer.invoke('snapshot:load'),
  saveSnapshot: (snapshot) => ipcRenderer.invoke('snapshot:save', snapshot),
});