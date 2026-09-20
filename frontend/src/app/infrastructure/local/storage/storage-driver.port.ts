import type { LocalDatabaseSnapshot } from '../local-database';

/**
 * Port for persisting the local database. Adapters may store the snapshot in
 * memory (tests), in IndexedDB (browser variant) or in SQLite/disk
 * (Electron desktop variant).
 */
export type StorageDriverPort = {
  load(): Promise<LocalDatabaseSnapshot | null>;
  save(snapshot: LocalDatabaseSnapshot): Promise<void>;
};