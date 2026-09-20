import type { LocalDatabaseSnapshot } from '../local-database';
import type { StorageDriverPort } from './storage-driver.port';

const OBJECT_STORE = 'snapshots';
const RECORD_KEY = 'snapshot';
const DATABASE_VERSION = 1;

/**
 * Browser/local persistence backed by IndexedDB. The whole database snapshot
 * is written as a single record inside one object store, mirroring the
 * persistence contract of the desktop variant (a single row in the SQLite
 * `snapshot` table).
 *
 * Connections are opened per operation and closed afterwards so callers can
 * delete the database (e.g. between tests, or when the user clears app data)
 * without running into `blocked` events caused by lingering connections.
 */
export class IndexedDbStorageDriver implements StorageDriverPort {
  constructor(private readonly databaseName = 'my-kanban-local') {}

  public async load(): Promise<LocalDatabaseSnapshot | null> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(OBJECT_STORE, 'readonly');
      const store = transaction.objectStore(OBJECT_STORE);
      const value = await promisifyRequest(store.get(RECORD_KEY));
      return value == null ? null : (value as LocalDatabaseSnapshot);
    } finally {
      database.close();
    }
  }

  public async save(snapshot: LocalDatabaseSnapshot): Promise<void> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(OBJECT_STORE, 'readwrite');
      transaction.objectStore(OBJECT_STORE).put(snapshot, RECORD_KEY,);
      await waitForTransaction(transaction);
    } finally {
      database.close();
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(OBJECT_STORE)) {
          database.createObjectStore(OBJECT_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error(`Database "${this.databaseName}" is blocked`));
    });
  }
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
