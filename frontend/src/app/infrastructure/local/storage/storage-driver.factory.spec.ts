import type { LocalDatabaseSnapshot } from '../local-database';
import { InMemoryStorageDriver } from './in-memory.storage-driver';
import { IndexedDbStorageDriver } from './indexed-db.storage-driver';
import { IpcStorageDriver } from './ipc.storage-driver';
import {
  createStorageDriver,
  detectStorageMode,
  type StorageMode,
} from './storage-driver.factory';

type BridgeApi = {
  loadSnapshot(): Promise<LocalDatabaseSnapshot | null>;
  saveSnapshot(snapshot: LocalDatabaseSnapshot): Promise<void>;
};

describe('createStorageDriver', () => {
  afterEach(() => {
    delete (window as Window & { api?: BridgeApi }).api;
  });

  it('creates the in-memory driver for the memory mode', () => {
    expect(createStorageDriver('memory')).toBeInstanceOf(InMemoryStorageDriver);
  });

  it('creates the IndexedDB driver for the browser mode', () => {
    expect(createStorageDriver('browser')).toBeInstanceOf(IndexedDbStorageDriver);
  });

  it('creates the IPC driver for the desktop mode when the preload bridge is present', () => {
    (window as Window & { api?: BridgeApi }).api = { loadSnapshot, saveSnapshot };
    expect(createStorageDriver('desktop')).toBeInstanceOf(IpcStorageDriver);
  });

  it('throws in the desktop mode when the preload bridge is missing', () => {
    expect(() => createStorageDriver('desktop')).toThrowError(/preload/i);
  });
});

describe('detectStorageMode', () => {
  afterEach(() => {
    delete (window as Window & { api?: BridgeApi }).api;
  });

  it('reports desktop when the preload bridge is present', () => {
    (window as Window & { api?: BridgeApi }).api = { loadSnapshot, saveSnapshot };
    expect(detectStorageMode()).toBe(StorageModeDesktop);
  });

  it('reports browser when IndexedDB is available without a bridge', () => {
    expect(detectStorageMode()).toBe(StorageModeBrowser);
  });
});

async function loadSnapshot(): Promise<LocalDatabaseSnapshot | null> {
  return null;
}

async function saveSnapshot(snapshot: LocalDatabaseSnapshot): Promise<void> {}

const StorageModeDesktop: StorageMode = 'desktop';
const StorageModeBrowser: StorageMode = 'browser';
