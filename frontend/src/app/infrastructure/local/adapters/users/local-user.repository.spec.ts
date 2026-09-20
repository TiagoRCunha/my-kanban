import { LocalDatabase } from '../../local-database';
import { InMemoryStorageDriver } from '../../storage/in-memory.storage-driver';
import { LocalBackend } from '../../local-backend';
import { LocalUserRepository } from './local-user.repository';
import { StaticLocalActor } from './static-local-actor';

describe('LocalUserRepository (DI veneer)', () => {
  let database: LocalDatabase;
  let backend: LocalBackend;
  let repository: LocalUserRepository;

  const NOW = '2026-09-20T10:00:00.000Z';

  beforeEach(() => {
    database = LocalDatabase.createEmpty();
    backend = new LocalBackend(database, {
      storage: new InMemoryStorageDriver(),
    });
    repository = new LocalUserRepository(backend, new StaticLocalActor(1));
  });

  /**
   * Seeds the acting user (id 1) as an ADMIN. The id 1 is consumed from the
   * users sequence first so subsequent created users get fresh, non-colliding
   * ids (e.g. 2, 3, ...).
   */
  function seedOwnerAsAdmin(): void {
    database.nextId('users');
    database.users.push({
      id: 1,
      fullName: 'Local Admin',
      email: 'admin@local.test',
      passwordHash: 'admin-hash',
      avatarUrl: null,
      role: 'ADMIN',
      emailVerified: true,
      createdAt: NOW,
      updatedAt: NOW,
    });
  }

  describe('findAll', () => {
    it('returns every user through the acting local actor', async () => {
      seedOwnerAsAdmin();
      await backend.createUser(1, {
        fullName: 'Alice',
        email: 'alice@example.com',
        password: 'alice-password',
      });

      const users = await repository.findAll();

      expect(users.map((u) => u.email.value)).toEqual([
        'admin@local.test',
        'alice@example.com',
      ]);
    });

    it('rejects when the acting user does not exist', async () => {
      await expectAsync(repository.findAll()).toBeRejected();
    });
  });

  describe('findById', () => {
    it('returns the matching user when it exists', async () => {
      seedOwnerAsAdmin();
      const alice = await backend.createUser(1, {
        fullName: 'Alice',
        email: 'alice@example.com',
        password: 'alice-password',
      });

      const user = await repository.findById(alice.id);

      expect(user.id).toBe(alice.id);
      expect(user.fullName).toBe('Alice');
    });

    it('rejects when the user does not exist', async () => {
      seedOwnerAsAdmin();
      await expectAsync(repository.findById(999)).toBeRejected();
    });
  });

  describe('create', () => {
    it('creates the user and returns the domain User', async () => {
      seedOwnerAsAdmin();

      const created = await repository.create({
        fullName: 'Bob',
        email: 'bob@example.com',
        passwordHash: 'bob-hash',
      });

      expect(created.fullName).toBe('Bob');
      expect(created.email.value).toBe('bob@example.com');
      expect(created.role).toBe('USER');

      const stored = await repository.findById(created.id);
      expect(stored.email.value).toBe('bob@example.com');
    });
  });

  describe('update', () => {
    it('updates the user and returns the refreshed domain User', async () => {
      seedOwnerAsAdmin();
      const created = await repository.create({
        fullName: 'Bob',
        email: 'bob@example.com',
        passwordHash: 'bob-hash',
      });

      const updated = await repository.update(created.id, {
        fullName: 'Bobby',
        email: 'bobby@example.com',
        passwordHash: 'bobby-hash',
      });

      expect(updated.fullName).toBe('Bobby');
      expect(updated.email.value).toBe('bobby@example.com');
    });
  });

  describe('delete', () => {
    it('removes the user from the local database', async () => {
      seedOwnerAsAdmin();
      const created = await repository.create({
        fullName: 'Bob',
        email: 'bob@example.com',
        passwordHash: 'bob-hash',
      });

      await repository.delete(created.id);

      await expectAsync(repository.findById(created.id)).toBeRejected();
    });
  });
});