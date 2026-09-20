import { IndexedDbStorageDriver } from './indexed-db.storage-driver';
import { InMemoryStorageDriver } from './in-memory.storage-driver';
import { IpcStorageDriver } from './ipc.storage-driver';
import type { DesktopStorageBridge } from './desktop-storage-bridge';
import type { StorageDriverPort } from './storage-driver.port';

/**
 * Which persistence backend a `StorageDriverPort` talks to. `detectEnvironment`
 * picks one based on the runtime, but callers (tests, the phase-4 DI wiring and
 * the desktop bootstrap) can also request a specific mode explicitly.
 */
export type StorageMode = 'memory' | 'browser' | 'desktop';

/** Mirrors the persistence contract of the Electron SQLite snapshot table. */
export type { DesktopStorageBridge };

export function createStorageDriver(mode: StorageMode): StorageDriverPort {
  switch (mode) {
    case 'browser':
      return new IndexedDbStorageDriver();
    case 'desktop': {
      const bridge = resolveDesktopBridge();
      return new IpcStorageDriver(bridge);
    }
    default:
      return new InMemoryStorageDriver();
  }
}

/**
 * Resolves the Electron preload bridge exposed as `window.api`. Throws when no
 * bridge is present, which can only happen if the app is started in desktop
 * mode outside Electron (a wiring mistake).
 */
function resolveDesktopBridge(): DesktopStorageBridge {
  const api = typeof window !== 'undefined' ? window.api : undefined;
  if (api == null) {
    throw new Error(
      'Desktop storage requires the Electron preload bridge (window.api), which is unavailable in this environment',
    );
  }
  return api;
}

export function detectStorageMode(): StorageMode {
  if (typeof window !== 'undefined' && window.api != null) {
    return 'desktop';
  }
  if (typeof indexedDB !== 'undefined' && 'indexedDB' in globalThis) {
    return 'browser';
  }
  return 'memory';
}
