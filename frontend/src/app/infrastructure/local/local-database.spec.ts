import { LocalDatabase, LOCAL_DATABASE_SCHEMA_VERSION } from './local-database';

describe('LocalDatabase', () => {
  it('creates an empty database with next ids starting at 1', () => {
    const database = LocalDatabase.createEmpty();

    expect(database.meta.schemaVersion).toBe(LOCAL_DATABASE_SCHEMA_VERSION);
    expect(database.users).toEqual([]);
    expect(database.userConfigs).toEqual([]);
    expect(database.userStartupColumns).toEqual([]);
    expect(database.userCustomTags).toEqual([]);
    expect(database.boards).toEqual([]);
    expect(database.boardColumns).toEqual([]);
    expect(database.boardMembers).toEqual([]);
    expect(database.tasks).toEqual([]);
    expect(database.taskAssignees).toEqual([]);
    expect(database.comments).toEqual([]);
    expect(database.nextId('users')).toBe(1);
  });

  it('assigns sequential ids per table', () => {
    const database = LocalDatabase.createEmpty();

    expect(database.nextId('boards')).toBe(1);
    expect(database.nextId('boards')).toBe(2);
    expect(database.nextId('users')).toBe(1);
    expect(database.nextId('comments')).toBe(1);
    expect(database.nextId('comments')).toBe(2);
  });

  it('round-trips through serialize and fromSnapshot', () => {
    const database = LocalDatabase.createEmpty();
    const now = '2026-09-19T10:00:00.000Z';

    database.users.push({
      id: database.nextId('users'),
      fullName: 'Tiago',
      email: 'tiago@example.com',
      passwordHash: 'hash',
      avatarUrl: null,
      role: 'USER',
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    database.boards.push({
      id: database.nextId('boards'),
      title: 'Board',
      description: null,
      ownerId: 1,
      createdAt: now,
      updatedAt: now,
    });

    const restored = LocalDatabase.fromSnapshot(database.serialize());

    expect(restored.users).toEqual(database.users);
    expect(restored.boards).toEqual(database.boards);
    expect(restored.nextId('users')).toBe(2);
    expect(restored.nextId('boards')).toBe(2);
  });

  it('rejects unsupported schema versions', () => {
    const snapshot = LocalDatabase.createEmpty().serialize();
    const unsupported = {
      ...snapshot,
      meta: { schemaVersion: LOCAL_DATABASE_SCHEMA_VERSION + 1 },
    };

    expect(() => LocalDatabase.fromSnapshot(unsupported)).toThrowError(/schema version/);
  });

  it('returns independent snapshots from serialize', () => {
    const database = LocalDatabase.createEmpty();
    const snapshot = database.serialize();

    database.users.push({
      id: 1,
      fullName: 'Tiago',
      email: 'tiago@example.com',
      passwordHash: 'hash',
      avatarUrl: null,
      role: 'USER',
      emailVerified: true,
      createdAt: '2026-09-19T10:00:00.000Z',
      updatedAt: '2026-09-19T10:00:00.000Z',
    });

    expect(snapshot.users).toEqual([]);
    expect(snapshot.nextIds['users']).toBe(1);
  });
});