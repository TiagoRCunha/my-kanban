import { LocalDatabase } from '../../local-database';
import { InMemoryStorageDriver } from '../../storage/in-memory.storage-driver';
import { LocalBackend } from '../../local-backend';
import { LocalColumnRepository } from './local-column.repository';
import { StaticLocalActor } from '../users/static-local-actor';

describe('LocalColumnRepository (DI veneer)', () => {
  let database: LocalDatabase;
  let backend: LocalBackend;
  let repository: LocalColumnRepository;

  const NOW = '2026-09-20T10:00:00.000Z';

  beforeEach(() => {
    database = LocalDatabase.createEmpty();
    backend = new LocalBackend(database, {
      storage: new InMemoryStorageDriver(),
    });
    repository = new LocalColumnRepository(backend, new StaticLocalActor(1));
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

  /** Seeds a board owned by the acting user and returns its id. */
  function seedBoard(): number {
    const boardId = database.nextId('boards');
    database.boards.push({
      id: boardId,
      title: 'Design Board',
      description: null,
      ownerId: 1,
      createdAt: NOW,
      updatedAt: NOW,
    });
    return boardId;
  }

  describe('findByBoardId', () => {
    it('returns the columns of the board ordered by position', async () => {
      seedOwner();
      const boardId = seedBoard();

      await repository.create({ title: 'To Do', position: 0, boardId });
      await repository.create({ title: 'Done', position: 0, boardId });

      const columns = await repository.findByBoardId(boardId);

      expect(columns.map((c) => c.title)).toEqual(['To Do', 'Done']);
    });
  });

  describe('findById', () => {
    it('is not supported by the local backend API, like the HTTP adapter', async () => {
      seedOwner();
      await expectAsync(repository.findById(1)).toBeRejected();
    });
  });

  describe('create', () => {
    it('creates the column with the next available position', async () => {
      seedOwner();
      const boardId = seedBoard();

      const column = await repository.create({ title: 'To Do', position: 0, boardId });

      expect(column.title).toBe('To Do');
      expect(column.position).toBe(0);
    });

    it('rejects a non-owner acting user', async () => {
      seedOwner();
      const boardId = seedBoard();
      const outsider = new LocalColumnRepository(backend, new StaticLocalActor(999));

      await expectAsync(
        outsider.create({ title: 'To Do', position: 0, boardId }),
      ).toBeRejected();
    });
  });

  describe('update', () => {
    it('updates the column and returns the refreshed domain Column', async () => {
      seedOwner();
      const boardId = seedBoard();
      const created = await repository.create({ title: 'To Do', position: 0, boardId });

      const updated = await repository.update(created.id, {
        title: 'In Progress',
        position: 0,
        boardId,
      });

      expect(updated.title).toBe('In Progress');
      expect(updated.id).toBe(created.id);
    });
  });

  describe('delete', () => {
    it('removes the column from the local database', async () => {
      seedOwner();
      const boardId = seedBoard();
      const created = await repository.create({ title: 'To Do', position: 0, boardId });

      await repository.delete(created.id, boardId);

      const columns = await repository.findByBoardId(boardId);
      expect(columns.length).toBe(0);
    });
  });

  describe('reorder', () => {
    it('applies the requested positions to the board columns', async () => {
      seedOwner();
      const boardId = seedBoard();
      const first = await repository.create({ title: 'To Do', position: 0, boardId });
      const second = await repository.create({ title: 'Done', position: 0, boardId });

      await repository.reorder(boardId, [
        { id: first.id, position: 1 },
        { id: second.id, position: 0 },
      ]);

      const columns = await repository.findByBoardId(boardId);
      expect(columns.map((c) => c.title)).toEqual(['Done', 'To Do']);
    });
  });
});