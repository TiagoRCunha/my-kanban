import { LocalDatabase } from '../../local-database';
import { InMemoryStorageDriver } from '../../storage/in-memory.storage-driver';
import { LocalBackend } from '../../local-backend';
import { LocalUserConfigRepository } from './local-user-config.repository';
import { StaticLocalActor } from '../users/static-local-actor';

describe('LocalUserConfigRepository (DI veneer)', () => {
  let database: LocalDatabase;
  let backend: LocalBackend;
  let repository: LocalUserConfigRepository;

  const NOW = '2026-09-20T10:00:00.000Z';

  beforeEach(() => {
    database = LocalDatabase.createEmpty();
    backend = new LocalBackend(database, {
      storage: new InMemoryStorageDriver(),
    });
    repository = new LocalUserConfigRepository(backend, new StaticLocalActor(1));
  });

  /** Seeds the acting user (id 1) and consumes its id from the users sequence. */
  function seedUser(): void {
    database.nextId('users');
    database.users.push({
      id: 1,
      fullName: 'Local User',
      email: 'local@test.dev',
      passwordHash: 'local-hash',
      avatarUrl: null,
      role: 'USER',
      emailVerified: true,
      createdAt: NOW,
      updatedAt: NOW,
    });
  }

  describe('getConfig', () => {
    it('returns the default configuration snapshot for the user', async () => {
      seedUser();

      const config = await repository.getConfig(1);

      expect(config.userId).toBe(1);
      expect(config.darkMode).toBe(false);
      expect(config.defaultTaskLimit).toBe(10);
      expect(config.startupColumns.length).toBe(0);
      expect(config.customTags.length).toBe(0);
    });

    it('rejects reading a configuration the actor does not own', async () => {
      seedUser();
      database.nextId('users');
      database.users.push({
        id: 2,
        fullName: 'Other',
        email: 'other@test.dev',
        passwordHash: 'other-hash',
        avatarUrl: null,
        role: 'USER',
        emailVerified: true,
        createdAt: NOW,
        updatedAt: NOW,
      });

      await expectAsync(repository.getConfig(2)).toBeRejected();
    });
  });

  describe('updateDarkMode', () => {
    it('persists the dark mode preference', async () => {
      seedUser();

      await repository.updateDarkMode(1, true);

      const config = await repository.getConfig(1);
      expect(config.darkMode).toBe(true);
    });
  });

  describe('updateConfig', () => {
    it('persists dark mode and task limit together', async () => {
      seedUser();

      await repository.updateConfig(1, { darkMode: true, defaultTaskLimit: 25 });

      const config = await repository.getConfig(1);
      expect(config.darkMode).toBe(true);
      expect(config.defaultTaskLimit).toBe(25);
    });
  });

  describe('saveStartupColumns', () => {
    it('replaces the startup columns of the user ordered by position', async () => {
      seedUser();

      const saved = await repository.saveStartupColumns(1, [
        { title: 'Backlog', position: 0, type: 'NORMAL' },
        { title: 'Done', position: 1, type: 'DONE' },
      ]);

      expect(saved.map((c) => c.title)).toEqual(['Backlog', 'Done']);
      expect(saved[1].type).toBe('DONE');

      const config = await repository.getConfig(1);
      expect(config.startupColumns.map((c) => c.title)).toEqual(['Backlog', 'Done']);
    });
  });

  describe('createCustomTag', () => {
    it('creates a custom tag for the user', async () => {
      seedUser();

      const tag = await repository.createCustomTag(1, {
        name: 'Urgent',
        color: '#FF5733',
        position: 0,
      });

      expect(tag.name).toBe('Urgent');
      expect(tag.color).toBe('#FF5733');

      const config = await repository.getConfig(1);
      expect(config.customTags.map((t) => t.name)).toEqual(['Urgent']);
    });
  });

  describe('updateCustomTag', () => {
    it('updates the tag name, color and position', async () => {
      seedUser();
      const created = await repository.createCustomTag(1, {
        name: 'Urgent',
        color: '#FF5733',
        position: 0,
      });

      const updated = await repository.updateCustomTag(1, created.id, {
        name: 'ASAP',
        color: '#00B8D9',
        position: 1,
      });

      expect(updated.name).toBe('ASAP');
      expect(updated.color).toBe('#00B8D9');
      expect(updated.position).toBe(1);
    });
  });

  describe('deleteCustomTag', () => {
    it('deletes the custom tag from the user configuration', async () => {
      seedUser();
      const created = await repository.createCustomTag(1, {
        name: 'Urgent',
        color: '#FF5733',
        position: 0,
      });

      await repository.deleteCustomTag(1, created.id);

      const config = await repository.getConfig(1);
      expect(config.customTags.length).toBe(0);
    });
  });
});