import { LocalDatabase } from '../../local-database';
import { InMemoryStorageDriver } from '../../storage/in-memory.storage-driver';
import { LocalBackend } from '../../local-backend';
import { LocalTaskRepository } from './local-task.repository';
import { StaticLocalActor } from '../users/static-local-actor';

describe('LocalTaskRepository (DI veneer)', () => {
  let database: LocalDatabase;
  let backend: LocalBackend;
  let repository: LocalTaskRepository;

  const NOW = '2026-09-20T10:00:00.000Z';

  beforeEach(() => {
    database = LocalDatabase.createEmpty();
    backend = new LocalBackend(database, {
      storage: new InMemoryStorageDriver(),
    });
    repository = new LocalTaskRepository(backend, new StaticLocalActor(1));
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

  /** Seeds a column at the next position within the board and returns its id. */
  function seedColumn(boardId: number, title = 'To Do', isDone = false): number {
    const id = database.nextId('boardColumns');
    const position = database.boardColumns.filter((c) => c.boardId === boardId).length;
    database.boardColumns.push({
      id,
      boardId,
      title,
      position,
      archived: false,
      isDone,
      createdAt: NOW,
    });
    return id;
  }

  describe('findByColumnId', () => {
    it('returns the tasks of the column ordered by position', async () => {
      seedOwner();
      const boardId = seedBoard();
      const columnId = seedColumn(boardId);

      await repository.create({ title: 'First', tagId: null, position: 0, reportedById: 1, columnId, assigneeIds: [] });
      await repository.create({ title: 'Second', tagId: null, position: 1, reportedById: 1, columnId, assigneeIds: [] });

      const tasks = await repository.findByColumnId(columnId);

      expect(tasks.map((t) => t.title)).toEqual(['First', 'Second']);
    });
  });

  describe('findById', () => {
    it('is not supported by the local backend API, like the HTTP adapter', async () => {
      seedOwner();
      await expectAsync(repository.findById(1)).toBeRejected();
    });
  });

  describe('create', () => {
    it('creates the task reported by the acting user and returns the domain Task', async () => {
      seedOwner();
      const boardId = seedBoard();
      const columnId = seedColumn(boardId);

      const task = await repository.create({
        title: 'Design the API',
        tagId: null,
        position: 0,
        reportedById: 1,
        columnId,
        assigneeIds: [],
      });

      expect(task.title).toBe('Design the API');
      expect(task.columnId).toBe(columnId);
      expect(task.reportedById).toBe(1);
    });
  });

  describe('update', () => {
    it('updates the task and returns the refreshed domain Task', async () => {
      seedOwner();
      const boardId = seedBoard();
      const columnId = seedColumn(boardId);
      const created = await repository.create({
        title: 'Design the API',
        tagId: null,
        position: 0,
        reportedById: 1,
        columnId,
        assigneeIds: [],
      });

      const updated = await repository.update(created.id, {
        title: 'Design the v2 API',
        tagId: null,
        position: 0,
        reportedById: 1,
        columnId,
        assigneeIds: [],
      });

      expect(updated.title).toBe('Design the v2 API');
      expect(updated.id).toBe(created.id);
    });
  });

  describe('delete', () => {
    it('removes the task from the local database', async () => {
      seedOwner();
      const boardId = seedBoard();
      const columnId = seedColumn(boardId);
      const created = await repository.create({
        title: 'Design the API',
        tagId: null,
        position: 0,
        reportedById: 1,
        columnId,
        assigneeIds: [],
      });

      await repository.delete(created.id, columnId);

      const tasks = await repository.findByColumnId(columnId);
      expect(tasks.length).toBe(0);
    });
  });

  describe('reorder', () => {
    it('applies the requested positions to the column tasks', async () => {
      seedOwner();
      const boardId = seedBoard();
      const columnId = seedColumn(boardId);
      const first = await repository.create({ title: 'First', tagId: null, position: 0, reportedById: 1, columnId, assigneeIds: [] });
      const second = await repository.create({ title: 'Second', tagId: null, position: 1, reportedById: 1, columnId, assigneeIds: [] });

      await repository.reorder(columnId, [
        { id: first.id, position: 1 },
        { id: second.id, position: 0 },
      ]);

      const tasks = await repository.findByColumnId(columnId);
      expect(tasks.map((t) => t.title)).toEqual(['Second', 'First']);
    });
  });

  describe('moveTask', () => {
    it('moves the task into the target column', async () => {
      seedOwner();
      const boardId = seedBoard();
      const sourceColumnId = seedColumn(boardId, 'To Do');
      const targetColumnId = seedColumn(boardId, 'Done', true);
      const task = await repository.create({
        title: 'Design the API',
        tagId: null,
        position: 0,
        reportedById: 1,
        columnId: sourceColumnId,
        assigneeIds: [],
      });

      await repository.moveTask(
        task.id,
        sourceColumnId,
        targetColumnId,
        0,
        null,
        [{ id: task.id, position: 0 }],
      );

      const targetTasks = await repository.findByColumnId(targetColumnId);
      expect(targetTasks.map((t) => t.title)).toEqual(['Design the API']);
    });
  });

  describe('markAsDone', () => {
    it('moves the task to the done column and flags it done', async () => {
      seedOwner();
      const boardId = seedBoard();
      const columnId = seedColumn(boardId, 'To Do');
      seedColumn(boardId, 'Done', true);
      const created = await repository.create({
        title: 'Design the API',
        tagId: null,
        position: 0,
        reportedById: 1,
        columnId,
        assigneeIds: [],
      });

      const done = await repository.markAsDone(created.id, columnId);

      expect(done.id).toBe(created.id);
    });
  });
});