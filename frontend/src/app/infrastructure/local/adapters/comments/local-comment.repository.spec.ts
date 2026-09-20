import { LocalDatabase } from '../../local-database';
import { InMemoryStorageDriver } from '../../storage/in-memory.storage-driver';
import { LocalBackend } from '../../local-backend';
import { LocalCommentRepository } from './local-comment.repository';
import { StaticLocalActor } from '../users/static-local-actor';

describe('LocalCommentRepository (DI veneer)', () => {
  let database: LocalDatabase;
  let backend: LocalBackend;
  let repository: LocalCommentRepository;

  const NOW = '2026-09-20T10:00:00.000Z';

  beforeEach(() => {
    database = LocalDatabase.createEmpty();
    backend = new LocalBackend(database, {
      storage: new InMemoryStorageDriver(),
    });
    repository = new LocalCommentRepository(backend, new StaticLocalActor(1));
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

  /** Seeds the full board -> column -> task chain and returns the task id. */
  function seedTask(): number {
    const boardId = database.nextId('boards');
    database.boards.push({
      id: boardId,
      title: 'Design Board',
      description: null,
      ownerId: 1,
      createdAt: NOW,
      updatedAt: NOW,
    });
    const columnId = database.nextId('boardColumns');
    database.boardColumns.push({
      id: columnId,
      boardId,
      title: 'To Do',
      position: 0,
      archived: false,
      isDone: false,
      createdAt: NOW,
    });
    const taskId = database.nextId('tasks');
    database.tasks.push({
      id: taskId,
      title: 'Design the API',
      description: null,
      priority: 'MEDIUM',
      dueDate: null,
      estimatedHours: null,
      position: 0,
      columnId,
      reportedById: 1,
      tagId: null,
      done: false,
      createdAt: NOW,
      updatedAt: NOW,
    });
    return taskId;
  }

  describe('findByTaskId', () => {
    it('returns the comments of the task ordered by creation', async () => {
      seedOwner();
      const taskId = seedTask();

      await repository.create({ content: 'First thought', taskId, authorId: 1 });
      await repository.create({ content: 'Second thought', taskId, authorId: 1 });

      const comments = await repository.findByTaskId(taskId);

      expect(comments.map((c) => c.content)).toEqual(['First thought', 'Second thought']);
    });
  });

  describe('findById', () => {
    it('is not supported by the local backend API, like the HTTP adapter', async () => {
      seedOwner();
      await expectAsync(repository.findById(1)).toBeRejected();
    });
  });

  describe('create', () => {
    it('creates the comment authored by the acting user', async () => {
      seedOwner();
      const taskId = seedTask();

      const comment = await repository.create({ content: 'Looking good', taskId, authorId: 1 });

      expect(comment.content).toBe('Looking good');
      expect(comment.taskId).toBe(taskId);
      expect(comment.authorId).toBe(1);
    });
  });

  describe('update', () => {
    it('updates the comment content and returns the refreshed domain Comment', async () => {
      seedOwner();
      const taskId = seedTask();
      const created = await repository.create({ content: 'Looking good', taskId, authorId: 1 });

      const updated = await repository.update(created.id, {
        content: 'Looking even better',
        taskId,
        authorId: 1,
      });

      expect(updated.content).toBe('Looking even better');
      expect(updated.id).toBe(created.id);
    });
  });

  describe('delete', () => {
    it('removes the comment from the local database', async () => {
      seedOwner();
      const taskId = seedTask();
      const created = await repository.create({ content: 'Looking good', taskId, authorId: 1 });

      await repository.delete(created.id, taskId);

      const comments = await repository.findByTaskId(taskId);
      expect(comments.length).toBe(0);
    });
  });
});