import { LocalDatabase } from '../../local-database';
import { InMemoryStorageDriver } from '../../storage/in-memory.storage-driver';
import { LocalBackend } from '../../local-backend';
import { LocalBoardRepository } from './local-board.repository';
import { StaticLocalActor } from '../users/static-local-actor';

describe('LocalBoardRepository (DI veneer)', () => {
  let database: LocalDatabase;
  let backend: LocalBackend;
  let repository: LocalBoardRepository;

  const NOW = '2026-09-20T10:00:00.000Z';

  beforeEach(() => {
    database = LocalDatabase.createEmpty();
    backend = new LocalBackend(database, {
      storage: new InMemoryStorageDriver(),
    });
    repository = new LocalBoardRepository(backend, new StaticLocalActor(1));
  });

  /** Seeds the acting user (id 1) and consumes its id from the users sequence. */
  function seedOwner(): void {
    database.nextId('users');
    database.users.push({
      id: 1,
      fullName: 'Local Owner',
      email: 'owner@local.test',
      passwordHash: 'owner-hash',
      avatarUrl: null,
      role: 'USER',
      emailVerified: true,
      createdAt: NOW,
      updatedAt: NOW,
    });
  }

  describe('findAll', () => {
    it('returns the boards the acting user can read', async () => {
      seedOwner();

      await repository.create({ title: 'Design Board', ownerId: 1 });
      const boards = await repository.findAll();

      expect(boards.map((b) => b.title)).toEqual(['Design Board']);
    });

    it('rejects when the acting user does not exist', async () => {
      await expectAsync(repository.findAll()).toBeRejected();
    });
  });

  describe('findById', () => {
    it('returns the matching board when it exists', async () => {
      seedOwner();
      const created = await repository.create({ title: 'Design Board', ownerId: 1 });

      const board = await repository.findById(created.id);

      expect(board.id).toBe(created.id);
      expect(board.title).toBe('Design Board');
      expect(board.ownerId).toBe(1);
    });

    it('rejects when the board does not exist', async () => {
      seedOwner();
      await expectAsync(repository.findById(999)).toBeRejected();
    });
  });

  describe('create', () => {
    it('creates the board and returns the domain Board', async () => {
      seedOwner();

      const board = await repository.create({
        title: 'Design Board',
        description: 'WIP',
        ownerId: 1,
      });

      expect(board.title).toBe('Design Board');
      expect(board.description).toBe('WIP');
      expect(board.ownerId).toBe(1);
    });
  });

  describe('update', () => {
    it('updates the board and returns the refreshed domain Board', async () => {
      seedOwner();
      const created = await repository.create({ title: 'Design Board', ownerId: 1 });

      const updated = await repository.update(created.id, {
        title: 'Platform Board',
        ownerId: 1,
      });

      expect(updated.title).toBe('Platform Board');
      expect(updated.id).toBe(created.id);
    });

    it('rejects a non-owner acting user', async () => {
      seedOwner();
      const created = await repository.create({ title: 'Design Board', ownerId: 1 });
      const outsider = new LocalBoardRepository(backend, new StaticLocalActor(999));
      await expectAsync(
        outsider.update(created.id, { title: 'Nope', ownerId: 999 }),
      ).toBeRejected();
    });
  });

  describe('delete', () => {
    it('removes the board from the local database', async () => {
      seedOwner();
      const created = await repository.create({ title: 'Design Board', ownerId: 1 });

      await repository.delete(created.id);

      await expectAsync(repository.findById(created.id)).toBeRejected();
    });
  });

  describe('leaveBoard', () => {
    it('lets a member leave a board they do not own', async () => {
      seedOwner();
      // A board owned by another user (id 2) that the actor (id 1) was invited to.
      database.nextId('users');
      database.users.push({
        id: 2,
        fullName: 'Board Owner',
        email: 'owner2@local.test',
        passwordHash: 'owner2-hash',
        avatarUrl: null,
        role: 'USER',
        emailVerified: true,
        createdAt: NOW,
        updatedAt: NOW,
      });
      database.nextId('boards');
      database.boards.push({
        id: 1,
        title: 'Shared Board',
        description: null,
        ownerId: 2,
        createdAt: NOW,
        updatedAt: NOW,
      });
      database.boardMembers.push({
        id: database.nextId('boardMembers'),
        boardId: 1,
        userId: 1,
        role: 'GUEST',
      });

      await repository.leaveBoard(1);

      expect(database.boardMembers.filter((m) => m.boardId === 1)).toEqual([]);
    });

    it('rejects when the owner tries to leave their own board', async () => {
      seedOwner();
      const created = await repository.create({ title: 'My Board', ownerId: 1 });

      await expectAsync(repository.leaveBoard(created.id)).toBeRejected();
    });
  });
});