import type { LocalDatabaseSnapshot } from '../local-database';
import type { DesktopStorageBridge } from './desktop-storage-bridge';
import type { StorageDriverPort } from './storage-driver.port';

/**
 * Persistence adapter for the desktop app. It delegates to the Electron
 * preload bridge (`window.api`) and therefore stores the snapshot in SQLite
 * via the main process; the renderer never touches the filesystem directly.
 *
 * The bridge exposes the same two-method contract as every other driver, so
 * the local engine is completely agnostic about whether it is running against
 * IndexedDB (web), SQLite through IPC (desktop) or an in-memory store (tests).
 */
export class IpcStorageDriver implements StorageDriverPort {
  constructor(private readonly bridge: DesktopStorageBridge) {}

  public load(): Promise<LocalDatabaseSnapshot | null> {
    return this.bridge.loadSnapshot();
  }

  public save(snapshot: LocalDatabaseSnapshot): Promise<void> {
    return this.bridge.saveSnapshot(snapshot);
  }
}
