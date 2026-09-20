import type { LocalDatabaseSnapshot } from '../local-database';

/**
 * Contract exposed by the Electron preload script as `window.api` (shown
 * inside the Electron renderer only). Every method is asynchronous because
 * the implementation performs SQLite work in the main process through IPC.
 *
 * The main process stores the whole snapshot as a single row in the SQLite
 * `snapshot` table, mirroring the single-record persistence contract of the
 * IndexedDB variant.
 */
export type DesktopStorageBridge = {
  loadSnapshot(): Promise<LocalDatabaseSnapshot | null>;
  saveSnapshot(snapshot: LocalDatabaseSnapshot): Promise<void>;
};

declare global {
  interface Window {
    /** Present only in the Electron renderer, installed by the preload script. */
    api?: DesktopStorageBridge;
  }
}

export {};
