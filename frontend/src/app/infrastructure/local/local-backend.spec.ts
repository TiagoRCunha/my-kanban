import type { AuthUserResponseDto } from '../auth/dto/auth-user-response.dto';
import { LocalBackend } from './local-backend';
import { LocalDatabase } from './local-database';
import { InMemoryStorageDriver } from './storage/in-memory.storage-driver';

function setup() {
  const database = LocalDatabase.createEmpty();
  const storage = new InMemoryStorageDriver();
  const backend = new LocalBackend(database, { storage });
  return { database, storage, backend };
}

async function registerUser(
  backend: LocalBackend,
  fullName = 'Alice',
  email = 'alice@example.com',
): Promise<AuthUserResponseDto> {
  return backend.register({ fullName, email, password: 'secret123' });
}

/**
 * Registers a user (and returns its id). Local registration auto-verifies the
 * account, so no separate email verification step is required.
 */
async function registerAndVerify(
  backend: LocalBackend,
  fullName = 'Alice',
  email = 'alice@example.com',
): Promise<number> {
  const user = await registerUser(backend, fullName, email);
  return user.id;
}

/** Awaits a promise that must reject with a specific LocalApiError status. */
async function expectLocalError(promise: Promise<unknown>, status: number): Promise<void> {
  let error: unknown = null;
  try {
    await promise;
  } catch (caught) {
    error = caught;
  }
  expect(error).not.toBeNull();
  if (error == null) {
    return;
  }
  expect((error as { status: number }).status).toBe(status);
}

describe('LocalBackend', () => {
  describe('auth', () => {
    it('registers a user with seeded config, startup columns and tags, and auto-verifies the account', async () => {
      const { backend, database } = setup();

      const user = await registerUser(backend);

      expect(user.email).toBe('alice@example.com');
      expect(user.role).toBe('USER');

      // Local/desktop registration has no email flow: the account is verified
      // immediately, so login succeeds without a verification step.
      await expectAsync(backend.login('alice@example.com', 'secret123')).toBeResolved();

      const record = database.users.find((u) => u.id === user.id);
      expect(record?.emailVerified).toBeTrue();
      const config = database.userConfigs.find((c) => c.userId === user.id);
      expect(config?.darkMode).toBeFalse();
      expect(config?.defaultTaskLimit).toBe(10);

      const columns = database.userStartupColumns
        .filter((c) => c.userId === user.id)
        .sort((a, b) => a.position - b.position);
      expect(columns.map((c) => c.title)).toEqual(['Backlog', 'In Progress', 'Testing', 'Done']);
      expect(columns.map((c) => c.type)).toEqual(['ARCHIVE', 'NORMAL', 'NORMAL', 'DONE']);

      const tags = database.userCustomTags
        .filter((t) => t.userId === user.id)
        .sort((a, b) => a.position - b.position);
      expect(tags.map((t) => t.name)).toEqual(['EASY', 'MEDIUM', 'HARD']);
      expect(tags.map((t) => t.color)).toEqual(['#4CAF50', '#FFC107', '#F44336']);
    });

    it('rejects duplicate emails on register', async () => {
      const { backend } = setup();
      await registerUser(backend);
      await expectLocalError(registerUser(backend), 409);
    });

    it('rejects unknown credentials with 401', async () => {
      const { backend } = setup();
      await registerAndVerify(backend);
      await expectLocalError(backend.login('unknown@example.com', 'x'), 401);
      await expectLocalError(backend.login('alice@example.com', 'wrong-password'), 401);
    });

    it('registers an auto-verified user and issues a decodable access token on login', async () => {
      const { backend } = setup();
      await registerUser(backend);

      // Local accounts are auto-verified, so registration emits no mail.
      expect(backend.takeOutbox()).toEqual([]);

      const tokenResponse = await backend.login('alice@example.com', 'secret123');
      expect(tokenResponse.tokenType).toBe('Bearer');
      expect(tokenResponse.expiresInMinutes).toBe(120);

      const payload = JSON.parse(atob(tokenResponse.accessToken.split('.')[1])) as {
        sub: string;
        uid: number;
      };
      expect(payload.sub).toBe('alice@example.com');
      expect(payload.uid).toBe(1);
    });

    it('still verifies pre-existing unverified accounts through the outbox token', async () => {
      const { backend, database } = setup();
      // A snapshot restored from disk may hold accounts created before the
      // local veneer auto-verified new registrations.
      database.nextId('users');
      database.users.push({
        id: 2,
        fullName: 'Legacy',
        email: 'legacy@example.com',
        passwordHash: 'password',
        avatarUrl: null,
        role: 'USER',
        emailVerified: false,
        createdAt: '2026-01-01T10:00:00.000Z',
        updatedAt: '2026-01-01T10:00:00.000Z',
      });

      const token = await backend.resendVerification('legacy@example.com');
      expect(token).not.toBeNull();

      const mail = backend.takeOutbox();
      expect(mail).toHaveSize(1);
      expect(mail[0].type).toBe('VERIFY_EMAIL');
      expect(mail[0].email).toBe('legacy@example.com');

      await backend.verifyEmail(mail[0].token);
      await expectAsync(backend.login('legacy@example.com', 'password')).toBeResolved();
    });

    it('rejects malformed or wrong-purpose verification tokens', async () => {
      const { backend } = setup();
      await registerUser(backend);
      await expectLocalError(backend.verifyEmail('not-a-token'), 401);

      const resetToken = await backend.forgotPassword('alice@example.com');
      await expectLocalError(backend.verifyEmail(resetToken ?? ''), 401);
    });

    it('issues reset tokens only for existing users and resets the password', async () => {
      const { backend } = setup();
      await registerAndVerify(backend);

      const token = await backend.forgotPassword('alice@example.com');
      expect(token).not.toBeNull();
      await expectAsync(backend.forgotPassword('ghost@example.com')).toBeResolvedTo(null);

      await backend.resetPassword(token ?? '', 'new-password-123');
      await backend.login('alice@example.com', 'new-password-123');
      await expectLocalError(backend.login('alice@example.com', 'secret123'), 401);
    });

    it('rejects reset tokens that are invalid or for a different purpose', async () => {
      const { backend, database } = setup();
      await registerAndVerify(backend);

      await expectLocalError(backend.resetPassword('garbage', 'new'), 401);

      // New registrations are auto-verified, so mint a verification token for
      // a manually-inserted unverified account to exercise the wrong-purpose
      // rejection.
      database.nextId('users');
      database.users.push({
        id: 2,
        fullName: 'Legacy',
        email: 'legacy@example.com',
        passwordHash: 'password',
        avatarUrl: null,
        role: 'USER',
        emailVerified: false,
        createdAt: '2026-01-01T10:00:00.000Z',
        updatedAt: '2026-01-01T10:00:00.000Z',
      });
      const verificationToken = await backend.resendVerification('legacy@example.com');
      expect(verificationToken).not.toBeNull();
      await expectLocalError(
        backend.resetPassword(verificationToken ?? '', 'new'),
        401,
      );
    });

    it('changes the password only when the current password matches', async () => {
      const { backend } = setup();
      const userId = await registerAndVerify(backend);

      await expectLocalError(backend.changePassword(userId, 'wrong', 'new-pass'), 403);
      await backend.changePassword(userId, 'secret123', 'new-pass');
      await backend.login('alice@example.com', 'new-pass');
    });

    it('rejects calls from an unknown current user', async () => {
      const { backend } = setup();
      await expectLocalError(backend.listBoards(999), 401);
    });
  });

  describe('boards', () => {
    it('creates a board and seeds columns from the startup columns', async () => {
      const { backend } = setup();
      const userId = await registerAndVerify(backend);

      const board = await backend.createBoard(userId, { title: 'My Board' });
      expect(board.ownerId).toBe(userId);
      expect(board.title).toBe('My Board');
      expect(board.description).toBeNull();

      const columns = await backend.listColumns(userId, board.id);
      expect(columns.map((c) => c.title)).toEqual(['Backlog', 'In Progress', 'Testing', 'Done']);
      expect(columns.map((c) => c.position)).toEqual([0, 1, 2, 3]);
      expect(columns[0].archived).toBeTrue();
      expect(columns[3].isDone).toBeTrue();
    });

    it('uses the saved startup columns when creating boards', async () => {
      const { backend } = setup();
      const userId = await registerAndVerify(backend);
      await backend.saveStartupColumns(userId, userId, [
        { title: 'Todo', position: 0, type: 'NORMAL' },
        { title: 'Archive', position: 1, type: 'ARCHIVE' },
      ]);

      const board = await backend.createBoard(userId, { title: 'B' });
      const columns = await backend.listColumns(userId, board.id);
      expect(columns.map((c) => c.title)).toEqual(['Todo', 'Archive']);
      expect(columns[1].archived).toBeTrue();
    });

    it('only exposes boards the user can read', async () => {
      const { backend } = setup();
      const ownerId = await registerAndVerify(backend, 'Owner', 'owner@example.com');
      const guestId = await registerAndVerify(backend, 'Guest', 'guest@example.com');

      const board = await backend.createBoard(ownerId, { title: 'Private' });

      expect(await backend.listBoards(ownerId)).toHaveSize(1);
      expect(await backend.listBoards(guestId)).toEqual([]);
      await expectLocalError(backend.findBoardById(guestId, board.id), 403);

      await backend.inviteMember(ownerId, board.id, { email: 'guest@example.com', role: 'GUEST' });
      expect(await backend.listBoards(guestId)).toHaveSize(1);
      await backend.findBoardById(guestId, board.id);
    });

    it('lets super admins read boards they do not own', async () => {
      const { backend, database } = setup();
      const ownerId = await registerAndVerify(backend, 'Owner', 'owner@example.com');
      const adminId = (await registerUser(backend, 'Admin', 'admin@example.com')).id;
      const adminRecord = database.users.find((u) => u.id === adminId);
      if (adminRecord) {
        adminRecord.role = 'ADMIN';
        adminRecord.emailVerified = true;
      }

      const board = await backend.createBoard(ownerId, { title: 'B' });
      await backend.findBoardById(adminId, board.id);
      expect(await backend.listBoards(adminId)).toHaveSize(1);
    });

    it('allows only the owner to update or delete a board', async () => {
      const { backend } = setup();
      const ownerId = await registerAndVerify(backend, 'Owner', 'owner@example.com');
      const memberId = await registerAndVerify(backend, 'Member', 'member@example.com');
      const board = await backend.createBoard(ownerId, { title: 'B' });
      await backend.inviteMember(ownerId, board.id, { email: 'member@example.com', role: 'GUEST' });

      await expectLocalError(
        backend.updateBoard(memberId, board.id, { title: 'Hijacked' }),
        403,
      );
      await expectLocalError(backend.deleteBoard(memberId, board.id), 403);

      const updated = await backend.updateBoard(ownerId, board.id, { title: 'Renamed' });
      expect(updated.title).toBe('Renamed');
    });

    it('prevents the owner from leaving a board', async () => {
      const { backend } = setup();
      const userId = await registerAndVerify(backend);
      const board = await backend.createBoard(userId, { title: 'B' });
      await expectLocalError(backend.leaveBoard(userId, board.id), 403);
    });

    it('lets a member leave a board', async () => {
      const { backend } = setup();
      const ownerId = await registerAndVerify(backend, 'Owner', 'owner@example.com');
      const memberId = await registerAndVerify(backend, 'Member', 'member@example.com');
      const board = await backend.createBoard(ownerId, { title: 'B' });
      await backend.inviteMember(ownerId, board.id, { email: 'member@example.com', role: 'GUEST' });

      await backend.leaveBoard(memberId, board.id);
      expect(await backend.listBoards(memberId)).toEqual([]);
    });

    it('throws 404 for unknown boards', async () => {
      const { backend } = setup();
      const userId = await registerAndVerify(backend);
      await expectLocalError(backend.findBoardById(userId, 4242), 404);
      await expectLocalError(backend.listColumns(userId, 4242), 404);
    });
  });

  describe('columns', () => {
    it('creates columns at the next position regardless of the requested position', async () => {
      const { backend } = setup();
      const userId = await registerAndVerify(backend);
      const board = await backend.createBoard(userId, { title: 'B' });

      const created = await backend.createColumn(userId, board.id, {
        title: 'Extra',
        position: 99,
      });
      expect(created.position).toBe(4);
    });

    it('rejects column updates that collide with another column position', async () => {
      const { backend } = setup();
      const userId = await registerAndVerify(backend);
      const board = await backend.createBoard(userId, { title: 'B' });
      const extra = await backend.createColumn(userId, board.id, {
        title: 'Extra',
        position: 4,
      });

      await expectLocalError(
        backend.updateColumn(userId, board.id, extra.id, { title: 'Extra', position: 0 }),
        409,
      );
    });

    it('only the owner can manage columns', async () => {
      const { backend } = setup();
      const ownerId = await registerAndVerify(backend, 'Owner', 'owner@example.com');
      const memberId = await registerAndVerify(backend, 'Member', 'member@example.com');
      const board = await backend.createBoard(ownerId, { title: 'B' });
      await backend.inviteMember(ownerId, board.id, { email: 'member@example.com', role: 'GUEST' });

      await expectLocalError(
        backend.createColumn(memberId, board.id, { title: 'X', position: 4 }),
        403,
      );
      await expectLocalError(
        backend.reorderColumns(memberId, board.id, []),
        403,
      );
    });

    it('reorders columns within the board', async () => {
      const { backend } = setup();
      const userId = await registerAndVerify(backend);
      const board = await backend.createBoard(userId, { title: 'B' });
      const columns = await backend.listColumns(userId, board.id);

      await backend.reorderColumns(userId, board.id, [
        { id: columns[0].id, position: 1 },
        { id: columns[1].id, position: 0 },
        { id: columns[2].id, position: 2 },
        { id: columns[3].id, position: 3 },
      ]);

      const after = await backend.listColumns(userId, board.id);
      expect(after.find((c) => c.id === columns[0].id)?.position).toBe(1);
      expect(after.find((c) => c.id === columns[1].id)?.position).toBe(0);
      expect(after.find((c) => c.id === columns[2].id)?.position).toBe(2);
    });

    it('rejects reorder items that do not belong to the board', async () => {
      const { backend } = setup();
      const userId = await registerAndVerify(backend);
      const board = await backend.createBoard(userId, { title: 'B' });

      await expectLocalError(
        backend.reorderColumns(userId, board.id, [{ id: 4242, position: 0 }]),
        404,
      );
    });
  });

  describe('tasks', () => {
    it('rejects tasks with duplicate positions in the same column', async () => {
      const { backend } = setup();
      const userId = await registerAndVerify(backend);
      const board = await backend.createBoard(userId, { title: 'B' });
      const workColumn = (await backend.listColumns(userId, board.id))[1];

      await backend.createTask(userId, workColumn.id, {
        title: 'T1',
        tagId: null,
        position: 0,
        assigneeIds: [],
      });
      await expectLocalError(
        backend.createTask(userId, workColumn.id, {
          title: 'T2',
          tagId: null,
          position: 0,
          assigneeIds: [],
        }),
        409,
      );
    });

    it('stores a MEDIUM priority by default and rejects foreign tags', async () => {
      const { backend, database } = setup();
      const userId = await registerAndVerify(backend);
      const otherId = await registerAndVerify(backend, 'Other', 'other@example.com');
      const board = await backend.createBoard(userId, { title: 'B' });
      const workColumn = (await backend.listColumns(userId, board.id))[1];

      const task = await backend.createTask(userId, workColumn.id, {
        title: 'T',
        tagId: null,
        position: 0,
        assigneeIds: [],
      });
      expect(database.tasks.find((t) => t.id === task.id)?.priority).toBe('MEDIUM');
      expect(database.tasks.find((t) => t.id === task.id)?.done).toBeFalse();

      const foreignTag = database.userCustomTags.find((t) => t.userId === otherId);
      await expectLocalError(
        backend.createTask(userId, workColumn.id, {
          title: 'X',
          tagId: foreignTag?.id ?? -1,
          position: 1,
          assigneeIds: [],
        }),
        404,
      );
    });

    it('rejects assignees that do not exist', async () => {
      const { backend } = setup();
      const userId = await registerAndVerify(backend);
      const board = await backend.createBoard(userId, { title: 'B' });
      const workColumn = (await backend.listColumns(userId, board.id))[1];

      await expectLocalError(
        backend.createTask(userId, workColumn.id, {
          title: 'T',
          tagId: null,
          position: 0,
          assigneeIds: [4242],
        }),
        404,
      );
    });

    it('allows only the creator, owner and super admins to manage a task', async () => {
      const { backend } = setup();
      const ownerId = await registerAndVerify(backend, 'Owner', 'owner@example.com');
      const memberId = await registerAndVerify(backend, 'Member', 'member@example.com');
      const board = await backend.createBoard(ownerId, { title: 'B' });
      await backend.inviteMember(ownerId, board.id, { email: 'member@example.com', role: 'GUEST' });
      const workColumn = (await backend.listColumns(ownerId, board.id))[1];

      const task = await backend.createTask(ownerId, workColumn.id, {
        title: 'T',
        tagId: null,
        position: 0,
        assigneeIds: [],
      });

      await expectLocalError(
        backend.updateTask(memberId, workColumn.id, task.id, {
          title: 'X',
          tagId: null,
          position: 0,
          assigneeIds: [],
        }),
        403,
      );
      await expectLocalError(backend.deleteTask(memberId, workColumn.id, task.id), 403);

      const updated = await backend.updateTask(ownerId, workColumn.id, task.id, {
        title: 'Updated',
        tagId: null,
        position: 0,
        assigneeIds: [],
      });
      expect(updated.title).toBe('Updated');
    });

    it('requires column management rights to move a task, even for its creator', async () => {
      const { backend } = setup();
      const ownerId = await registerAndVerify(backend, 'Owner', 'owner@example.com');
      const memberId = await registerAndVerify(backend, 'Member', 'member@example.com');
      const board = await backend.createBoard(ownerId, { title: 'B' });
      await backend.inviteMember(ownerId, board.id, { email: 'member@example.com', role: 'GUEST' });
      const columns = await backend.listColumns(ownerId, board.id);

      const task = await backend.createTask(memberId, columns[1].id, {
        title: 'T',
        tagId: null,
        position: 0,
        assigneeIds: [],
      });

      await expectLocalError(
        backend.moveTask(memberId, task.id, {
          targetColumnId: columns[2].id,
          position: 0,
          reorderedSourceTasks: null,
          reorderedTargetTasks: [{ id: task.id, position: 0 }],
        }),
        403,
      );
    });

    it('moves a task between columns and reorders the target column', async () => {
      const { backend } = setup();
      const userId = await registerAndVerify(backend);
      const board = await backend.createBoard(userId, { title: 'B' });
      const columns = await backend.listColumns(userId, board.id);

      const task = await backend.createTask(userId, columns[1].id, {
        title: 'T',
        tagId: null,
        position: 0,
        assigneeIds: [],
      });

      await backend.moveTask(userId, task.id, {
        targetColumnId: columns[2].id,
        position: 0,
        reorderedSourceTasks: null,
        reorderedTargetTasks: [{ id: task.id, position: 0 }],
      });

      const moved = (await backend.listTasks(userId, columns[2].id)).find((t) => t.id === task.id);
      expect(moved?.columnId).toBe(columns[2].id);
      expect(moved?.position).toBe(0);
      expect(moved?.done).toBeFalse();
      expect(await backend.listTasks(userId, columns[1].id)).toHaveSize(0);
    });

    it('rejects moving a task to a column of another board', async () => {
      const { backend } = setup();
      const userId = await registerAndVerify(backend);
      const boardA = await backend.createBoard(userId, { title: 'A' });
      const boardB = await backend.createBoard(userId, { title: 'B' });
      const columnsA = await backend.listColumns(userId, boardA.id);
      const columnsB = await backend.listColumns(userId, boardB.id);

      const task = await backend.createTask(userId, columnsA[1].id, {
        title: 'T',
        tagId: null,
        position: 0,
        assigneeIds: [],
      });

      await expectLocalError(
        backend.moveTask(userId, task.id, {
          targetColumnId: columnsB[1].id,
          position: 0,
          reorderedSourceTasks: null,
          reorderedTargetTasks: [{ id: task.id, position: 0 }],
        }),
        404,
      );
    });

    it('markTaskAsDone moves the task to the done column with the next position', async () => {
      const { backend } = setup();
      const userId = await registerAndVerify(backend);
      const board = await backend.createBoard(userId, { title: 'B' });
      const columns = await backend.listColumns(userId, board.id);
      const doneColumn = columns.find((c) => c.isDone);
      expect(doneColumn).toBeDefined();

      const task = await backend.createTask(userId, columns[1].id, {
        title: 'T',
        tagId: null,
        position: 0,
        assigneeIds: [],
      });

      const done = await backend.markTaskAsDone(userId, task.id);
      expect(done.done).toBeTrue();
      expect(done.columnId).toBe(doneColumn!.id);
      expect(done.position).toBe(0);

      const second = await backend.createTask(userId, columns[1].id, {
        title: 'T2',
        tagId: null,
        position: 0,
        assigneeIds: [],
      });
      const done2 = await backend.markTaskAsDone(userId, second.id);
      expect(done2.position).toBe(1);
    });

    it('returns 404 when no done column exists', async () => {
      const { backend, database } = setup();
      const userId = await registerAndVerify(backend);
      const board = await backend.createBoard(userId, { title: 'B' });
      const columns = await backend.listColumns(userId, board.id);

      // Remove the only done column to force the not-found path.
      const doneColumn = database.boardColumns.find((c) => c.isDone);
      database.boardColumns = database.boardColumns.filter((c) => c.id !== doneColumn?.id);

      const task = await backend.createTask(userId, columns[1].id, {
        title: 'T',
        tagId: null,
        position: 0,
        assigneeIds: [],
      });

      await expectLocalError(backend.markTaskAsDone(userId, task.id), 404);
    });
  });

  describe('comments', () => {
    it('blocks comments on done tasks', async () => {
      const { backend } = setup();
      const userId = await registerAndVerify(backend);
      const board = await backend.createBoard(userId, { title: 'B' });
      const workColumn = (await backend.listColumns(userId, board.id))[1];

      const task = await backend.createTask(userId, workColumn.id, {
        title: 'T',
        tagId: null,
        position: 0,
        assigneeIds: [],
      });
      await backend.markTaskAsDone(userId, task.id);

      await expectLocalError(backend.createComment(userId, task.id, 'nice'), 403);
    });

    it('lists comments for readers of the board', async () => {
      const { backend } = setup();
      const userId = await registerAndVerify(backend);
      const board = await backend.createBoard(userId, { title: 'B' });
      const workColumn = (await backend.listColumns(userId, board.id))[1];
      const task = await backend.createTask(userId, workColumn.id, {
        title: 'T',
        tagId: null,
        position: 0,
        assigneeIds: [],
      });

      const comment = await backend.createComment(userId, task.id, 'first');
      expect(comment.authorId).toBe(userId);
      expect(comment.content).toBe('first');

      const listed = await backend.listComments(userId, task.id);
      expect(listed).toHaveSize(1);
      expect(listed[0].updatedAt).toBeDefined();
    });

    it('allows only the comment author to edit or delete their comment', async () => {
      const { backend } = setup();
      const ownerId = await registerAndVerify(backend, 'Owner', 'owner@example.com');
      const memberId = await registerAndVerify(backend, 'Member', 'member@example.com');
      const board = await backend.createBoard(ownerId, { title: 'B' });
      await backend.inviteMember(ownerId, board.id, { email: 'member@example.com', role: 'GUEST' });
      const workColumn = (await backend.listColumns(ownerId, board.id))[1];

      const task = await backend.createTask(ownerId, workColumn.id, {
        title: 'T',
        tagId: null,
        position: 0,
        assigneeIds: [],
      });
      const comment = await backend.createComment(memberId, task.id, 'my comment');

      await expectLocalError(
        backend.updateComment(ownerId, task.id, comment.id, 'hacked'),
        403,
      );
      await expectLocalError(backend.deleteComment(ownerId, task.id, comment.id), 403);

      const updated = await backend.updateComment(memberId, task.id, comment.id, 'edited');
      expect(updated.content).toBe('edited');
    });
  });

  describe('members', () => {
    it('rejects self invites, duplicate members and unassignable roles', async () => {
      const { backend } = setup();
      const ownerId = await registerAndVerify(backend, 'Owner', 'owner@example.com');
      const guestId = await registerAndVerify(backend, 'Guest', 'guest@example.com');
      const board = await backend.createBoard(ownerId, { title: 'B' });

      await expectLocalError(
        backend.inviteMember(ownerId, board.id, { email: 'owner@example.com', role: 'GUEST' }),
        409,
      );
      await backend.inviteMember(ownerId, board.id, { email: 'guest@example.com', role: 'GUEST' });
      await expectLocalError(
        backend.inviteMember(ownerId, board.id, { email: 'guest@example.com', role: 'GUEST' }),
        409,
      );
      await expectLocalError(
        backend.inviteMember(ownerId, board.id, { email: 'other@example.com', role: 'OWNER' }),
        404,
      );
      await expectLocalError(
        backend.inviteMember(ownerId, board.id, { email: 'guest@example.com', role: 'OWNER' }),
        409,
      );
    });

    it('returns 404 when inviting an unknown email', async () => {
      const { backend } = setup();
      const ownerId = await registerAndVerify(backend, 'Owner', 'owner@example.com');
      const board = await backend.createBoard(ownerId, { title: 'B' });

      await expectLocalError(
        backend.inviteMember(ownerId, board.id, { email: 'ghost@example.com', role: 'GUEST' }),
        404,
      );
    });

    it('only the owner or a super admin can manage members', async () => {
      const { backend, database } = setup();
      const ownerId = await registerAndVerify(backend, 'Owner', 'owner@example.com');
      const memberId = await registerAndVerify(backend, 'Member', 'member@example.com');
      const otherId = await registerAndVerify(backend, 'Other', 'other@example.com');
      const board = await backend.createBoard(ownerId, { title: 'B' });

      const member = await backend.inviteMember(ownerId, board.id, {
        email: 'member@example.com',
        role: 'GUEST',
      });

      await expectLocalError(
        backend.inviteMember(memberId, board.id, { email: 'other@example.com', role: 'GUEST' }),
        403,
      );
      await expectLocalError(
        backend.updateMemberRole(memberId, board.id, member.id, 'VIEW_ONLY'),
        403,
      );
      await expectLocalError(backend.removeMember(memberId, board.id, member.id), 403);

      await backend.updateMemberRole(ownerId, board.id, member.id, 'VIEW_ONLY');
      expect(
        (await backend.listMembers(ownerId, board.id)).find((m) => m.id === member.id)?.role,
      ).toBe('VIEW_ONLY');
    });

    it('returns email and full name of each member', async () => {
      const { backend } = setup();
      const ownerId = await registerAndVerify(backend, 'Owner', 'owner@example.com');
      const memberId = await registerAndVerify(backend, 'Member', 'member@example.com');
      const board = await backend.createBoard(ownerId, { title: 'B' });
      await backend.inviteMember(ownerId, board.id, { email: 'member@example.com', role: 'GUEST' });

      const members = await backend.listMembers(ownerId, board.id);
      expect(members).toHaveSize(1);
      expect(members[0].email).toBe('member@example.com');
      expect(members[0].fullName).toBe('Member');
      expect(members[0].role).toBe('GUEST');
    });
  });

  describe('user config and tags', () => {
    it('creates default config on demand and applies updates', async () => {
      const { backend } = setup();
      const userId = await registerAndVerify(backend);

      const config = await backend.getUserConfig(userId, userId);
      expect(config.darkMode).toBeFalse();
      expect(config.defaultTaskLimit).toBe(10);

      const updated = await backend.updateUserConfig(userId, userId, {
        darkMode: true,
        defaultTaskLimit: 25,
      });
      expect(updated.darkMode).toBeTrue();
      expect(updated.defaultTaskLimit).toBe(25);
    });

    it('rejects custom tags with duplicate positions', async () => {
      const { backend } = setup();
      const userId = await registerAndVerify(backend);

      await expectLocalError(
        backend.createCustomTag(userId, userId, { name: 'NEW', color: '#112233', position: 0 }),
        409,
      );
    });

    it('reindexes custom tag positions after deletion', async () => {
      const { backend, database } = setup();
      const userId = await registerAndVerify(backend);
      const tags = await backend.listCustomTags(userId, userId);

      await backend.deleteCustomTag(userId, userId, tags[0].id);

      const remaining = database.userCustomTags
        .filter((t) => t.userId === userId)
        .sort((a, b) => a.position - b.position);
      expect(remaining.map((t) => t.position)).toEqual([0, 1]);
      expect(remaining.map((t) => t.name)).toEqual(['MEDIUM', 'HARD']);
    });

    it('detaches tasks from a deleted custom tag', async () => {
      const { backend, database } = setup();
      const userId = await registerAndVerify(backend);
      const board = await backend.createBoard(userId, { title: 'B' });
      const workColumn = (await backend.listColumns(userId, board.id))[1];
      const tags = await backend.listCustomTags(userId, userId);

      const task = await backend.createTask(userId, workColumn.id, {
        title: 'T',
        tagId: tags[0].id,
        position: 0,
        assigneeIds: [],
      });
      expect(database.tasks.find((t) => t.id === task.id)?.tagId).toBe(tags[0].id);

      await backend.deleteCustomTag(userId, userId, tags[0].id);
      expect(database.tasks.find((t) => t.id === task.id)?.tagId).toBeNull();
    });
  });

  describe('persistence', () => {
    it('persists mutations to the storage driver', async () => {
      const { backend, storage } = setup();
      const userId = await registerAndVerify(backend);
      await backend.createBoard(userId, { title: 'B' });

      const snapshot = await storage.load();
      expect(snapshot).not.toBeNull();
      expect(snapshot?.users).toHaveSize(1);
      expect(snapshot?.boards).toHaveSize(1);
      expect(snapshot?.boardColumns).toHaveSize(4);
    });

    it('restores a database from a previously saved snapshot', async () => {
      const { backend, storage } = setup();
      const userId = await registerAndVerify(backend, 'Owner', 'owner@example.com');
      const board = await backend.createBoard(userId, { title: 'Persisted' });

      const snapshot = await storage.load();
      expect(snapshot).not.toBeNull();
      const restored = new LocalBackend(LocalDatabase.fromSnapshot(snapshot!), { storage });
      const boards = await restored.listBoards(userId);
      expect(boards).toHaveSize(1);
      expect(boards[0].id).toBe(board.id);
    });
  });
});