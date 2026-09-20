import type { LocalDatabaseSnapshot } from '../local-database';
import type { StorageDriverPort } from './storage-driver.port';

/**
 * Reference storage driver that keeps the snapshot in memory. Used by unit
 * tests and as the default for `LocalBackend`.
 */
export class InMemoryStorageDriver implements StorageDriverPort {
  private snapshot: LocalDatabaseSnapshot | null = null;

  public async save(snapshot: LocalDatabaseSnapshot): Promise<void> {
    this.snapshot = snapshot;
  }

  public async load(): Promise<LocalDatabaseSnapshot | null> {
    return this.snapshot;
  }
}