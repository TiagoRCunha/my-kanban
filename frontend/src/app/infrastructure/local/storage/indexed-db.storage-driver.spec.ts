import { LocalDatabase, type LocalDatabaseSnapshot } from '../local-database';
import { IndexedDbStorageDriver } from './indexed-db.storage-driver';

describe('IndexedDbStorageDriver', () => {
  let driver: IndexedDbStorageDriver;
  let databaseName: string;
  let sequence = 0;

  beforeEach(() => {
    sequence += 1;
    databaseName = `my-kanban-spec-${Date.now()}-${sequence}`;
    driver = new IndexedDbStorageDriver(databaseName);
  });

  afterEach(async () => {
    await deleteDatabase(databaseName);
  });

  function makeSnapshot(): LocalDatabaseSnapshot {
    const database = LocalDatabase.createEmpty();
    const now = '2026-09-20T10:00:00.000Z';
    database.users.push({
      id: database.nextId('users'),
      fullName: 'Alice Chen',
      email: 'alice@example.com',
      passwordHash: 'hash',
      avatarUrl: null,
      role: 'USER',
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    return database.serialize();
  }

  it('returns null when nothing was saved yet', async () => {
    await expectAsync(driver.load()).toBeResolvedTo(null);
  });

  it('round-trips a snapshot back from IndexedDB', async () => {
    const snapshot = makeSnapshot();

    await driver.save(snapshot);
    await expectAsync(driver.load()).toBeResolvedTo(snapshot);
  });

  it('overwrites the previously stored snapshot', async () => {
    const first = makeSnapshot();
    await driver.save(first);

    const second = makeSnapshot();
    second.users.push({
      id: second.nextIds.users,
      fullName: 'Carol',
      email: 'carol@example.com',
      passwordHash: 'hash',
      avatarUrl: null,
      role: 'USER',
      emailVerified: true,
      createdAt: '2026-09-20T10:00:00.000Z',
      updatedAt: '2026-09-20T10:00:00.000Z',
    });
    await driver.save(second);

    await expectAsync(driver.load()).toBeResolvedTo(second);
  });

  it('reads data saved by a previous driver instance', async () => {
    const snapshot = makeSnapshot();
    await driver.save(snapshot);

    const secondDriver = new IndexedDbStorageDriver(databaseName);
    await expectAsync(secondDriver.load()).toBeResolvedTo(snapshot);
  });

  async function deleteDatabase(name: string): Promise<void> {
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  }
});
