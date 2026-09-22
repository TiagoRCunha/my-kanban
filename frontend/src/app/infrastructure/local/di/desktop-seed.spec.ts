import { LocalDatabase } from '../local-database';
import { InMemoryStorageDriver } from '../storage/in-memory.storage-driver';
import { LocalSessionStore } from './session.store';
import {
  DEFAULT_LOCAL_USER_EMAIL,
  DEFAULT_LOCAL_USER_FULL_NAME,
  DEFAULT_LOCAL_USER_PASSWORD,
  seedLocalSession,
} from './desktop-seed';

describe('seedLocalSession', () => {
  afterEach(() => localStorage.clear());

  it('seeds the default account and signs it in on an empty database', async () => {
    const database = LocalDatabase.createEmpty();
    const session = new LocalSessionStore();
    const driver = new InMemoryStorageDriver();

    await seedLocalSession(database, session, driver);

    expect(database.users).toHaveSize(1);
    expect(database.users[0]).toEqual(
      jasmine.objectContaining({
        email: DEFAULT_LOCAL_USER_EMAIL,
        fullName: DEFAULT_LOCAL_USER_FULL_NAME,
        passwordHash: DEFAULT_LOCAL_USER_PASSWORD,
        role: 'ADMIN',
        emailVerified: true,
      }),
    );
    expect(session.getUserId()).toBe(database.users[0].id);
  });

  it('persists the seeded snapshot so the account survives restarts', async () => {
    const database = LocalDatabase.createEmpty();
    const driver = new InMemoryStorageDriver();

    await seedLocalSession(database, new LocalSessionStore(), driver);

    const restored = await driver.load();
    expect(restored?.users).toHaveSize(1);
    expect(restored?.users[0].email).toBe(DEFAULT_LOCAL_USER_EMAIL);
  });

  it('does not duplicate the account on subsequent runs', async () => {
    const database = LocalDatabase.createEmpty();
    const driver = new InMemoryStorageDriver();
    const session = new LocalSessionStore();

    await seedLocalSession(database, session, driver);
    await seedLocalSession(database, session, driver);

    expect(database.users).toHaveSize(1);
  });

  it('keeps an existing session when the account already exists', async () => {
    const database = LocalDatabase.createEmpty();
    await seedLocalSession(database, new LocalSessionStore(), new InMemoryStorageDriver());
    const session = new LocalSessionStore();
    session.setUserId(database.users[0].id);

    await seedLocalSession(database, session, new InMemoryStorageDriver());

    expect(session.getUserId()).toBe(database.users[0].id);
  });
});