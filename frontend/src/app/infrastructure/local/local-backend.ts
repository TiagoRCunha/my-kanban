import type { AuthTokenResponseDto } from '../auth/dto/auth-token-response.dto';
import type { AuthUserResponseDto } from '../auth/dto/auth-user-response.dto';
import type { BoardMemberResponseDto } from '../board/dto/board-member.dto';
import type { BoardResponseDto } from '../board/dto/board.dto';
import type { BoardColumnResponseDto } from '../board/dto/column.dto';
import type { CommentResponseDto } from '../board/dto/comment.dto';
import type { TaskResponseDto } from '../board/dto/task.dto';
import type { UserConfigResponseDto } from '../user-config/dto/user-config.dto';
import type { CustomTagResponseDto } from '../user-config/dto/user-config.dto';
import type { StartupColumnResponseDto } from '../user-config/dto/user-config.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';
import {
  LocalDatabase,
  type LocalBoard,
  type LocalBoardColumn,
  type LocalBoardMember,
  type LocalComment,
  type LocalCustomTag,
  type LocalStartupColumn,
  type LocalTask,
  type LocalUser,
  type LocalUserConfig,
} from './local-database';
import { InMemoryStorageDriver } from './storage/in-memory.storage-driver';
import type { StorageDriverPort } from './storage/storage-driver.port';

export const ACCESS_TOKEN_TTL_MINUTES = 120;
const VERIFICATION_TOKEN_TTL_MINUTES = 240;
const RESET_TOKEN_TTL_MINUTES = 30;

/**
 * Error raised by the local backend, carrying an HTTP-like status code so
 * that phase-4 adapters can translate it into an `HttpErrorResponse`-shaped
 * rejection.
 */
export class LocalApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'LocalApiError';
  }

  public static unauthorized(message = 'Unauthorized'): LocalApiError {
    return new LocalApiError(401, message);
  }

  public static forbidden(message = 'Forbidden'): LocalApiError {
    return new LocalApiError(403, message);
  }

  public static notFound(message = 'Not found'): LocalApiError {
    return new LocalApiError(404, message);
  }

  public static conflict(message = 'Conflict'): LocalApiError {
    return new LocalApiError(409, message);
  }
}

/**
 * Port for hashing/verifying passwords. Phase 3 wires bcrypt and respects
 * the "encode only when needed" contract mirrored by the backend.
 */
export type PasswordHasher = {
  hash(plain: string): Promise<string>;
  matches(plain: string, stored: string): Promise<boolean>;
};

/**
 * Reference implementation for tests: stores passwords in plain text and
 * compares them directly.
 */
export class PlainPasswordHasher implements PasswordHasher {
  public async hash(plain: string): Promise<string> {
    return plain;
  }

  public async matches(plain: string, stored: string): Promise<boolean> {
    return plain === stored;
  }
}

/**
 * Local counterpart of the Domain Events carrying one-time tokens (e.g.
 * {@code UserRegisteredEvent}). Phase-4 local auth adapters read this outbox
 * to show verification/reset tokens instead of sending real emails.
 */
export type LocalMailItem = {
  type: 'VERIFY_EMAIL' | 'PASSWORD_RESET';
  email: string;
  token: string;
  expiresInMinutes: number;
};

type TokenPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

type OneTimeTokenPayload = {
  purpose: TokenPurpose;
  uid: number;
  exp: number;
};

export type LocalBackendOptions = {
  passwordHasher?: PasswordHasher;
  storage?: StorageDriverPort;
};

export type ReorderItemInput = {
  id: number;
  position: number;
};

/**
 * In-process backend for the offline/desktop variant. It is a faithful port
 * of the Spring use-case handlers (Board, BoardColumn, Task, Comment,
 * BoardMember, Auth, User, UserConfig) and mirrors their business rules and
 * exception semantics. Every method is session-less: the acting user id is
 * passed explicitly. Responses are shaped exactly like the frontend response
 * DTOs so phase-4 adapters can reuse the existing mappers unchanged.
 */
export class LocalBackend {
  public readonly database: LocalDatabase;

  private readonly passwordHasher: PasswordHasher;
  private readonly storage: StorageDriverPort;
  private readonly outbox: LocalMailItem[] = [];

  constructor(
    database: LocalDatabase,
    options: LocalBackendOptions = {},
  ) {
    this.database = database;
    this.passwordHasher = options.passwordHasher ?? new PlainPasswordHasher();
    this.storage = options.storage ?? new InMemoryStorageDriver();
  }

  /**
   * Returns and clears the pending one-time-token "emails" generated during
   * registration, password reset and verification resend.
   */
  public takeOutbox(): LocalMailItem[] {
    const items = [...this.outbox];
    this.outbox.length = 0;
    return items;
  }

  // ─── Auth ────────────────────────────────────────────────────────────────

  public async login(email: string, password: string): Promise<AuthTokenResponseDto> {
    const user = this.database.users.find((u) => u.email === email);
    if (!user || !(await this.passwordHasher.matches(password, user.passwordHash))) {
      throw LocalApiError.unauthorized('Invalid credentials');
    }
    if (!user.emailVerified) {
      throw LocalApiError.forbidden('Please verify your email before signing in');
    }
    return this.createAccessToken(user);
  }

  public async register(input: {
    fullName: string;
    email: string;
    password: string;
    avatarUrl?: string | null;
  }): Promise<AuthUserResponseDto> {
    // The local/desktop variant has no email flow, so new accounts are
    // trusted (emailVerified) right away.
    return this.createUserAccount(input.fullName, input.email, input.password, input.avatarUrl ?? null, 'USER', true);
  }

  public async verifyEmail(token: string): Promise<void> {
    const userId = this.decodeOneTimeToken(token, 'EMAIL_VERIFICATION', 'Invalid or expired verification link');
    const user = this.getUser(userId);
    if (!user.emailVerified) {
      user.emailVerified = true;
      user.updatedAt = this.now();
      await this.persist();
    }
  }

  /**
   * Mirrors the backend behaviour: returns the fresh token only when the
   * account exists and is unverified, otherwise null.
   */
  public async resendVerification(email: string): Promise<string | null> {
    const user = this.database.users.find((u) => u.email === email);
    if (!user || user.emailVerified) {
      return null;
    }
    const token = this.createOneTimeToken(user, 'EMAIL_VERIFICATION', VERIFICATION_TOKEN_TTL_MINUTES);
    this.pushMail('VERIFY_EMAIL', user.email, token, VERIFICATION_TOKEN_TTL_MINUTES);
    return token;
  }

  /**
   * Mirrors the backend behaviour: returns the reset token only when the
   * account exists, otherwise null.
   */
  public async forgotPassword(email: string): Promise<string | null> {
    const user = this.database.users.find((u) => u.email === email);
    if (!user) {
      return null;
    }
    const token = this.createOneTimeToken(user, 'PASSWORD_RESET', RESET_TOKEN_TTL_MINUTES);
    this.pushMail('PASSWORD_RESET', user.email, token, RESET_TOKEN_TTL_MINUTES);
    return token;
  }

  public async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = this.decodeOneTimeToken(token, 'PASSWORD_RESET', 'Invalid or expired reset link');
    const user = this.getUser(userId);
    user.passwordHash = await this.passwordHasher.hash(newPassword);
    user.updatedAt = this.now();
    await this.persist();
  }

  public async changePassword(
    currentUserId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = this.requireCurrentUser(currentUserId);
    if (!(await this.passwordHasher.matches(currentPassword, user.passwordHash))) {
      throw LocalApiError.forbidden('Current password is incorrect');
    }
    user.passwordHash = await this.passwordHasher.hash(newPassword);
    user.updatedAt = this.now();
    await this.persist();
  }

  // ─── Users ───────────────────────────────────────────────────────────────

  public async listUsers(currentUserId: number): Promise<UserResponseDto[]> {
    this.requireCurrentUser(currentUserId);
    return this.database.users.map((u) => this.toUserDto(u)).sort((a, b) => a.id - b.id);
  }

  public async findUserById(currentUserId: number, userId: number): Promise<UserResponseDto> {
    this.requireCurrentUser(currentUserId);
    return this.toUserDto(this.getUser(userId));
  }

  /**
   * Admin-style creation: the account is created trusted (emailVerified).
   */
  public async createUser(
    currentUserId: number,
    input: {
      fullName: string;
      email: string;
      password: string;
      avatarUrl?: string | null;
      role?: string;
    },
  ): Promise<UserResponseDto> {
    this.requireCurrentUser(currentUserId);
    return this.createUserAccount(
      input.fullName,
      input.email,
      input.password,
      input.avatarUrl ?? null,
      input.role ?? 'USER',
      true,
    );
  }

  public async updateUser(
    currentUserId: number,
    userId: number,
    input: {
      fullName: string;
      email: string;
      password: string;
      avatarUrl?: string | null;
    },
  ): Promise<UserResponseDto> {
    this.assertCanManageUser(userId, currentUserId);
    const user = this.getUser(userId);
    const duplicate = this.database.users.find((u) => u.email === input.email && u.id !== userId);
    if (duplicate) {
      throw LocalApiError.conflict('Email already in use');
    }
    user.fullName = input.fullName.trim();
    user.email = input.email;
    user.passwordHash = await this.passwordHasher.hash(input.password);
    if (input.avatarUrl != null) {
      user.avatarUrl = input.avatarUrl.trim() || null;
    }
    user.updatedAt = this.now();
    await this.persist();
    return this.toUserDto(user);
  }

  public async deleteUser(currentUserId: number, userId: number): Promise<void> {
    this.assertCanManageUser(userId, currentUserId);
    this.getUser(userId);
    this.cascadeDeleteUser(userId);
    await this.persist();
  }

  // ─── User configuration ───────────────────────────────────────────────────

  public async getUserConfig(currentUserId: number, userId: number): Promise<UserConfigResponseDto> {
    this.assertCanManageUser(userId, currentUserId, 'You can only manage your own configuration');
    const config = this.getOrCreateUserConfig(userId);
    await this.persist();
    return this.toUserConfigDto(config);
  }

  public async updateUserConfig(
    currentUserId: number,
    userId: number,
    input: { darkMode?: boolean; defaultTaskLimit?: number },
  ): Promise<UserConfigResponseDto> {
    this.assertCanManageUser(userId, currentUserId, 'You can only manage your own configuration');
    const config = this.getOrCreateUserConfig(userId);
    if (input.darkMode !== undefined) {
      config.darkMode = input.darkMode;
    }
    if (input.defaultTaskLimit !== undefined) {
      config.defaultTaskLimit = input.defaultTaskLimit;
    }
    config.updatedAt = this.now();
    await this.persist();
    return this.toUserConfigDto(config);
  }

  public async listStartupColumns(
    currentUserId: number,
    userId: number,
  ): Promise<StartupColumnResponseDto[]> {
    this.assertCanManageUser(userId, currentUserId, 'You can only manage your own configuration');
    return this.database.userStartupColumns
      .filter((c) => c.userId === userId)
      .sort((a, b) => a.position - b.position)
      .map((c) => this.toStartupColumnDto(c));
  }

  public async saveStartupColumns(
    currentUserId: number,
    userId: number,
    columns: { title: string; position: number; type?: string }[],
  ): Promise<StartupColumnResponseDto[]> {
    this.assertCanManageUser(userId, currentUserId, 'You can only manage your own configuration');
    this.getUser(userId);
    const now = this.now();
    this.database.userStartupColumns = this.database.userStartupColumns.filter((c) => c.userId !== userId);
    for (const column of columns) {
      this.database.userStartupColumns.push({
        id: this.database.nextId('userStartupColumns'),
        userId,
        title: column.title.trim(),
        position: column.position,
        type: column.type ?? 'NORMAL',
        createdAt: now,
      });
    }
    await this.persist();
    return this.listStartupColumns(userId, userId);
  }

  public async listCustomTags(currentUserId: number, userId: number): Promise<CustomTagResponseDto[]> {
    this.assertCanManageUser(userId, currentUserId, 'You can only manage your own configuration');
    return this.database.userCustomTags
      .filter((t) => t.userId === userId)
      .sort((a, b) => a.position - b.position)
      .map((t) => this.toCustomTagDto(t));
  }

  public async createCustomTag(
    currentUserId: number,
    userId: number,
    tag: { name: string; color: string; position: number },
  ): Promise<CustomTagResponseDto> {
    this.assertCanManageUser(userId, currentUserId, 'You can only manage your own configuration');
    this.getUser(userId);
    if (this.database.userCustomTags.some((t) => t.userId === userId && t.position === tag.position)) {
      throw LocalApiError.conflict('Tag position already in use');
    }
    const created: LocalCustomTag = {
      id: this.database.nextId('userCustomTags'),
      userId,
      name: tag.name.trim(),
      color: tag.color,
      position: tag.position,
      createdAt: this.now(),
    };
    this.database.userCustomTags.push(created);
    await this.persist();
    return this.toCustomTagDto(created);
  }

  public async updateCustomTag(
    currentUserId: number,
    userId: number,
    tagId: number,
    tag: { name: string; color: string; position: number },
  ): Promise<CustomTagResponseDto> {
    this.assertCanManageUser(userId, currentUserId, 'You can only manage your own configuration');
    const existing = this.database.userCustomTags.find((t) => t.id === tagId && t.userId === userId);
    if (!existing) {
      throw LocalApiError.notFound('Custom tag not found');
    }
    if (
      this.database.userCustomTags.some(
        (t) => t.userId === userId && t.position === tag.position && t.id !== tagId,
      )
    ) {
      throw LocalApiError.conflict('Tag position already in use');
    }
    existing.name = tag.name.trim();
    existing.color = tag.color;
    existing.position = tag.position;
    await this.persist();
    return this.toCustomTagDto(existing);
  }

  public async deleteCustomTag(currentUserId: number, userId: number, tagId: number): Promise<void> {
    this.assertCanManageUser(userId, currentUserId, 'You can only manage your own configuration');
    const tag = this.database.userCustomTags.find((t) => t.id === tagId && t.userId === userId);
    if (!tag) {
      throw LocalApiError.notFound('Custom tag not found');
    }
    this.database.userCustomTags = this.database.userCustomTags.filter((t) => t.id !== tagId);
    this.reindexCustomTags(userId);
    // ON DELETE SET NULL semantics: tasks referencing the deleted tag lose it.
    for (const task of this.database.tasks) {
      if (task.tagId === tagId) {
        task.tagId = null;
      }
    }
    await this.persist();
  }

  // ─── Boards ───────────────────────────────────────────────────────────────

  public async listBoards(currentUserId: number): Promise<BoardResponseDto[]> {
    const user = this.requireCurrentUser(currentUserId);
    return this.database.boards
      .filter((board) => this.canReadBoard(board, user))
      .sort((a, b) => a.id - b.id)
      .map((board) => this.toBoardDto(board));
  }

  public async findBoardById(currentUserId: number, boardId: number): Promise<BoardResponseDto> {
    const user = this.requireCurrentUser(currentUserId);
    const board = this.getBoard(boardId);
    this.assertCanReadBoard(board, user);
    return this.toBoardDto(board);
  }

  /**
   * Creates the board and immediately seeds its columns from the acting
   * user's startup columns.
   */
  public async createBoard(
    currentUserId: number,
    input: { title: string; description?: string | null },
  ): Promise<BoardResponseDto> {
    const user = this.requireCurrentUser(currentUserId);
    const now = this.now();
    const board: LocalBoard = {
      id: this.database.nextId('boards'),
      title: input.title.trim(),
      description: input.description?.trim() || null,
      ownerId: user.id,
      createdAt: now,
      updatedAt: now,
    };
    this.database.boards.push(board);

    const startupColumns = this.database.userStartupColumns
      .filter((c) => c.userId === user.id)
      .sort((a, b) => a.position - b.position);
    for (const startupColumn of startupColumns) {
      this.database.boardColumns.push({
        id: this.database.nextId('boardColumns'),
        boardId: board.id,
        title: startupColumn.title,
        position: startupColumn.position,
        archived: startupColumn.type === 'ARCHIVE',
        isDone: startupColumn.type === 'DONE',
        createdAt: now,
      });
    }

    await this.persist();
    return this.toBoardDto(board);
  }

  public async updateBoard(
    currentUserId: number,
    boardId: number,
    input: { title: string; description?: string | null },
  ): Promise<BoardResponseDto> {
    const user = this.requireCurrentUser(currentUserId);
    const board = this.getBoard(boardId);
    this.assertCanManageBoard(board, user);
    board.title = input.title.trim();
    board.description = input.description?.trim() || null;
    board.updatedAt = this.now();
    await this.persist();
    return this.toBoardDto(board);
  }

  public async deleteBoard(currentUserId: number, boardId: number): Promise<void> {
    const user = this.requireCurrentUser(currentUserId);
    const board = this.getBoard(boardId);
    this.assertCanManageBoard(board, user);
    this.deleteBoardData(boardId);
    await this.persist();
  }

  public async leaveBoard(currentUserId: number, boardId: number): Promise<void> {
    const user = this.requireCurrentUser(currentUserId);
    const board = this.getBoard(boardId);
    if (board.ownerId === user.id) {
      throw LocalApiError.forbidden('Board owner cannot leave the board');
    }
    const member = this.database.boardMembers.find((m) => m.boardId === boardId && m.userId === user.id);
    if (!member) {
      throw LocalApiError.forbidden('You are not a member of this board');
    }
    this.database.boardMembers = this.database.boardMembers.filter((m) => m.id !== member.id);
    await this.persist();
  }

  // ─── Columns ──────────────────────────────────────────────────────────────

  public async listColumns(currentUserId: number, boardId: number): Promise<BoardColumnResponseDto[]> {
    const user = this.requireCurrentUser(currentUserId);
    const board = this.getBoard(boardId);
    this.assertCanReadBoard(board, user);
    return this.database.boardColumns
      .filter((c) => c.boardId === boardId)
      .sort((a, b) => a.position - b.position)
      .map((c) => this.toColumnDto(c));
  }

  /**
   * Mirrors the backend: the column position is always the current column
   * count, regardless of the requested position.
   */
  public async createColumn(
    currentUserId: number,
    boardId: number,
    input: { title: string; position: number; archived?: boolean; isDone?: boolean },
  ): Promise<BoardColumnResponseDto> {
    const user = this.requireCurrentUser(currentUserId);
    const board = this.getBoard(boardId);
    this.assertCanManageColumn(board, user);
    const nextPosition = this.database.boardColumns.filter((c) => c.boardId === boardId).length;
    const column: LocalBoardColumn = {
      id: this.database.nextId('boardColumns'),
      boardId,
      title: input.title.trim(),
      position: nextPosition,
      archived: input.archived ?? false,
      isDone: input.isDone ?? false,
      createdAt: this.now(),
    };
    this.database.boardColumns.push(column);
    await this.persist();
    return this.toColumnDto(column);
  }

  public async updateColumn(
    currentUserId: number,
    boardId: number,
    columnId: number,
    input: { title: string; position: number; archived?: boolean; isDone?: boolean },
  ): Promise<BoardColumnResponseDto> {
    const user = this.requireCurrentUser(currentUserId);
    const column = this.getExistingBoardColumn(boardId, columnId);
    this.assertCanManageColumn(this.getBoard(column.boardId), user);
    if (
      this.database.boardColumns.some(
        (c) => c.boardId === boardId && c.position === input.position && c.id !== columnId,
      )
    ) {
      throw LocalApiError.conflict('Board column position already in use');
    }
    column.title = input.title.trim();
    column.position = input.position;
    column.archived = input.archived ?? false;
    column.isDone = input.isDone ?? false;
    await this.persist();
    return this.toColumnDto(column);
  }

  public async deleteColumn(currentUserId: number, boardId: number, columnId: number): Promise<void> {
    const user = this.requireCurrentUser(currentUserId);
    const column = this.getExistingBoardColumn(boardId, columnId);
    this.assertCanManageColumn(this.getBoard(column.boardId), user);
    this.deleteColumnData(columnId);
    await this.persist();
  }

  public async reorderColumns(
    currentUserId: number,
    boardId: number,
    items: ReorderItemInput[],
  ): Promise<void> {
    const user = this.requireCurrentUser(currentUserId);
    const board = this.getBoard(boardId);
    this.assertCanManageColumn(board, user);
    const columns = this.database.boardColumns.filter((c) => c.boardId === boardId);
    const validIds = new Set(columns.map((c) => c.id));
    for (const item of items) {
      if (!validIds.has(item.id)) {
        throw LocalApiError.notFound('Column not found in board');
      }
    }
    const positionById = new Map(items.map((i) => [i.id, i.position]));
    for (const column of columns) {
      const position = positionById.get(column.id);
      if (position !== undefined) {
        column.position = position;
      }
    }
    await this.persist();
  }

  // ─── Tasks ────────────────────────────────────────────────────────────────

  public async listTasks(currentUserId: number, columnId: number): Promise<TaskResponseDto[]> {
    const user = this.requireCurrentUser(currentUserId);
    const column = this.getColumn(columnId);
    this.assertCanReadBoard(this.getBoard(column.boardId), user);
    return this.database.tasks
      .filter((t) => t.columnId === columnId)
      .sort((a, b) => a.position - b.position)
      .map((t) => this.toTaskDto(t));
  }

  public async createTask(
    currentUserId: number,
    columnId: number,
    input: {
      title: string;
      description?: string | null;
      tagId: number | null;
      dueDate?: string | null;
      estimatedHours?: number | null;
      position: number;
      assigneeIds: number[];
      priority?: string | null;
    },
  ): Promise<TaskResponseDto> {
    const user = this.requireCurrentUser(currentUserId);
    const column = this.getColumn(columnId);
    const board = this.getBoard(column.boardId);
    this.assertCanCreateTask(board, user);
    if (this.database.tasks.some((t) => t.columnId === columnId && t.position === input.position)) {
      throw LocalApiError.conflict('Task position already in use');
    }
    const now = this.now();
    const task: LocalTask = {
      id: this.database.nextId('tasks'),
      title: input.title.trim(),
      description: input.description?.trim() || null,
      priority: input.priority ?? 'MEDIUM',
      dueDate: input.dueDate ?? null,
      estimatedHours: input.estimatedHours ?? null,
      position: input.position,
      columnId,
      reportedById: user.id,
      tagId: this.resolveTag(input.tagId, user.id),
      done: false,
      createdAt: now,
      updatedAt: now,
    };
    this.database.tasks.push(task);
    this.setTaskAssignees(task.id, input.assigneeIds);
    await this.persist();
    return this.toTaskDto(task);
  }

  public async updateTask(
    currentUserId: number,
    columnId: number,
    taskId: number,
    input: {
      title: string;
      description?: string | null;
      tagId: number | null;
      dueDate?: string | null;
      estimatedHours?: number | null;
      position: number;
      assigneeIds: number[];
      priority?: string | null;
    },
  ): Promise<TaskResponseDto> {
    const user = this.requireCurrentUser(currentUserId);
    const task = this.getExistingTask(columnId, taskId);
    this.assertCanManageTask(task, user);
    if (
      this.database.tasks.some(
        (t) => t.columnId === columnId && t.position === input.position && t.id !== taskId,
      )
    ) {
      throw LocalApiError.conflict('Task position already in use');
    }
    task.title = input.title.trim();
    task.description = input.description?.trim() || null;
    task.tagId = this.resolveTag(input.tagId, user.id);
    task.dueDate = input.dueDate ?? null;
    task.estimatedHours = input.estimatedHours ?? null;
    task.priority = input.priority ?? task.priority;
    task.position = input.position;
    this.setTaskAssignees(task.id, input.assigneeIds);
    task.updatedAt = this.now();
    await this.persist();
    return this.toTaskDto(task);
  }

  public async deleteTask(currentUserId: number, columnId: number, taskId: number): Promise<void> {
    const user = this.requireCurrentUser(currentUserId);
    const task = this.getExistingTask(columnId, taskId);
    this.assertCanManageTask(task, user);
    this.database.comments = this.database.comments.filter((c) => c.taskId !== taskId);
    this.database.taskAssignees = this.database.taskAssignees.filter((a) => a.taskId !== taskId);
    this.database.tasks = this.database.tasks.filter((t) => t.id !== taskId);
    await this.persist();
  }

  public async reorderTasks(
    currentUserId: number,
    columnId: number,
    items: ReorderItemInput[],
  ): Promise<void> {
    const user = this.requireCurrentUser(currentUserId);
    const column = this.getColumn(columnId);
    this.assertCanManageColumn(this.getBoard(column.boardId), user);
    const tasks = this.database.tasks.filter((t) => t.columnId === columnId);
    const validIds = new Set(tasks.map((t) => t.id));
    for (const item of items) {
      if (!validIds.has(item.id)) {
        throw LocalApiError.notFound('Task not found in column');
      }
    }
    const positionById = new Map(items.map((i) => [i.id, i.position]));
    for (const task of tasks) {
      const position = positionById.get(task.id);
      if (position !== undefined) {
        task.position = position;
      }
    }
    await this.persist();
  }

  public async markTaskAsDone(currentUserId: number, taskId: number): Promise<TaskResponseDto> {
    const user = this.requireCurrentUser(currentUserId);
    const task = this.getTask(taskId);
    this.assertCanManageTask(task, user);
    const board = this.getBoard(this.getColumn(task.columnId).boardId);
    const doneColumn = this.database.boardColumns.find((c) => c.boardId === board.id && c.isDone);
    if (!doneColumn) {
      throw LocalApiError.notFound('No done column found in this board');
    }
    task.done = true;
    task.columnId = doneColumn.id;
    task.position = this.database.tasks.filter((t) => t.columnId === doneColumn.id && t.id !== taskId)
      .length;
    task.updatedAt = this.now();
    await this.persist();
    return this.toTaskDto(task);
  }

  public async moveTask(
    currentUserId: number,
    taskId: number,
    input: {
      targetColumnId: number;
      position: number;
      reorderedSourceTasks?: ReorderItemInput[] | null;
      reorderedTargetTasks: ReorderItemInput[];
    },
  ): Promise<void> {
    const user = this.requireCurrentUser(currentUserId);
    const task = this.getTask(taskId);
    this.assertCanManageTask(task, user);
    const sourceColumn = this.getColumn(task.columnId);
    this.assertCanManageColumn(this.getBoard(sourceColumn.boardId), user);

    const targetColumn = this.getColumn(input.targetColumnId);
    if (sourceColumn.boardId !== targetColumn.boardId) {
      throw LocalApiError.notFound('Target column not found in the same board');
    }

    task.columnId = targetColumn.id;
    task.done = targetColumn.isDone;
    task.position = Math.floor(Number.MAX_SAFE_INTEGER / 2);
    task.updatedAt = this.now();

    if (input.reorderedSourceTasks && sourceColumn.id !== targetColumn.id) {
      this.applyTaskPositions(sourceColumn.id, input.reorderedSourceTasks);
    }
    this.applyTaskPositions(targetColumn.id, input.reorderedTargetTasks);
    await this.persist();
  }

  // ─── Comments ─────────────────────────────────────────────────────────────

  public async listComments(currentUserId: number, taskId: number): Promise<CommentResponseDto[]> {
    const user = this.requireCurrentUser(currentUserId);
    const task = this.getTask(taskId);
    this.assertCanReadBoard(this.getBoard(this.getColumn(task.columnId).boardId), user);
    return this.database.comments
      .filter((c) => c.taskId === taskId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id)
      .map((c) => this.toCommentDto(c));
  }

  public async createComment(
    currentUserId: number,
    taskId: number,
    content: string,
  ): Promise<CommentResponseDto> {
    const user = this.requireCurrentUser(currentUserId);
    const task = this.getTask(taskId);
    if (task.done) {
      throw LocalApiError.forbidden('Cannot comment on a done task');
    }
    const board = this.getBoard(this.getColumn(task.columnId).boardId);
    this.assertCanCreateComment(board, user);
    const now = this.now();
    const comment: LocalComment = {
      id: this.database.nextId('comments'),
      content: content.trim(),
      taskId,
      authorId: user.id,
      createdAt: now,
      updatedAt: now,
    };
    this.database.comments.push(comment);
    await this.persist();
    return this.toCommentDto(comment);
  }

  public async updateComment(
    currentUserId: number,
    taskId: number,
    commentId: number,
    content: string,
  ): Promise<CommentResponseDto> {
    const user = this.requireCurrentUser(currentUserId);
    const comment = this.getExistingComment(taskId, commentId);
    this.assertCanManageComment(comment, user);
    comment.content = content.trim();
    comment.updatedAt = this.now();
    await this.persist();
    return this.toCommentDto(comment);
  }

  public async deleteComment(
    currentUserId: number,
    taskId: number,
    commentId: number,
  ): Promise<void> {
    const user = this.requireCurrentUser(currentUserId);
    const comment = this.getExistingComment(taskId, commentId);
    this.assertCanManageComment(comment, user);
    this.database.comments = this.database.comments.filter((c) => c.id !== commentId);
    await this.persist();
  }

  // ─── Board members ────────────────────────────────────────────────────────

  public async listMembers(currentUserId: number, boardId: number): Promise<BoardMemberResponseDto[]> {
    const user = this.requireCurrentUser(currentUserId);
    const board = this.getBoard(boardId);
    this.assertCanReadBoard(board, user);
    return this.database.boardMembers
      .filter((m) => m.boardId === boardId)
      .sort((a, b) => a.id - b.id)
      .map((m) => this.toMemberDto(m));
  }

  public async inviteMember(
    currentUserId: number,
    boardId: number,
    input: { email: string; role: string },
  ): Promise<BoardMemberResponseDto> {
    const user = this.requireCurrentUser(currentUserId);
    const board = this.getBoard(boardId);
    this.assertIsBoardOwnerOrSuperAdmin(board, user);
    const invitedUser = this.database.users.find((u) => u.email === input.email);
    if (!invitedUser) {
      throw LocalApiError.notFound(`User with email '${input.email}' not found`);
    }
    if (invitedUser.id === user.id) {
      throw LocalApiError.conflict('You cannot invite yourself to the board');
    }
    if (this.database.boardMembers.some((m) => m.boardId === boardId && m.userId === invitedUser.id)) {
      throw LocalApiError.conflict('User is already a member of this board');
    }
    const role = this.parseAssignableRole(input.role);
    const member: LocalBoardMember = {
      id: this.database.nextId('boardMembers'),
      boardId,
      userId: invitedUser.id,
      role,
    };
    this.database.boardMembers.push(member);
    await this.persist();
    return this.toMemberDto(member);
  }

  public async updateMemberRole(
    currentUserId: number,
    boardId: number,
    memberId: number,
    role: string,
  ): Promise<BoardMemberResponseDto> {
    const user = this.requireCurrentUser(currentUserId);
    const board = this.getBoard(boardId);
    this.assertIsBoardOwnerOrSuperAdmin(board, user);
    const member = this.getBoardMember(boardId, memberId);
    member.role = this.parseAssignableRole(role);
    await this.persist();
    return this.toMemberDto(member);
  }

  public async removeMember(
    currentUserId: number,
    boardId: number,
    memberId: number,
  ): Promise<void> {
    const user = this.requireCurrentUser(currentUserId);
    const board = this.getBoard(boardId);
    this.assertIsBoardOwnerOrSuperAdmin(board, user);
    const member = this.getBoardMember(boardId, memberId);
    this.database.boardMembers = this.database.boardMembers.filter((m) => m.id !== member.id);
    await this.persist();
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async persist(): Promise<void> {
    await this.storage.save(this.database.serialize());
  }

  private now(): string {
    return new Date().toISOString();
  }

  private createAccessToken(user: LocalUser): AuthTokenResponseDto {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: user.email,
        uid: user.id,
        exp: Date.now() + ACCESS_TOKEN_TTL_MINUTES * 60_000,
      }),
    );
    return {
      accessToken: `${header}.${payload}.local-signature`,
      tokenType: 'Bearer',
      expiresInMinutes: ACCESS_TOKEN_TTL_MINUTES,
    };
  }

  private createOneTimeToken(user: LocalUser, purpose: TokenPurpose, ttlMinutes: number): string {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({ purpose, uid: user.id, exp: Date.now() + ttlMinutes * 60_000 }),
    );
    return `${header}.${payload}.local-signature`;
  }

  private decodeOneTimeToken(token: string, expectedPurpose: TokenPurpose, invalidMessage: string): number {
    let payload: OneTimeTokenPayload;
    try {
      payload = JSON.parse(atob(token.split('.')[1] ?? '')) as OneTimeTokenPayload;
    } catch {
      throw LocalApiError.unauthorized(invalidMessage);
    }
    if (
      payload.purpose !== expectedPurpose ||
      typeof payload.uid !== 'number' ||
      typeof payload.exp !== 'number' ||
      payload.exp < Date.now()
    ) {
      throw LocalApiError.unauthorized(invalidMessage);
    }
    return payload.uid;
  }

  private pushMail(
    type: LocalMailItem['type'],
    email: string,
    token: string,
    expiresInMinutes: number,
  ): void {
    this.outbox.push({ type, email, token, expiresInMinutes });
  }

  private async createUserAccount(
    fullName: string,
    email: string,
    password: string,
    avatarUrl: string | null,
    role: string,
    emailVerified: boolean,
  ): Promise<AuthUserResponseDto> {
    if (this.database.users.some((u) => u.email === email)) {
      throw LocalApiError.conflict('Email already in use');
    }
    const now = this.now();
    const id = this.database.nextId('users');
    const user: LocalUser = {
      id,
      fullName: fullName.trim(),
      email,
      passwordHash: await this.passwordHasher.hash(password),
      avatarUrl: avatarUrl?.trim() || null,
      role,
      emailVerified,
      createdAt: now,
      updatedAt: now,
    };
    this.database.users.push(user);
    this.seedUserDefaults(id, now);
    if (!emailVerified) {
      const token = this.createOneTimeToken(user, 'EMAIL_VERIFICATION', VERIFICATION_TOKEN_TTL_MINUTES);
      this.pushMail('VERIFY_EMAIL', user.email, token, VERIFICATION_TOKEN_TTL_MINUTES);
    }
    await this.persist();
    return this.toUserDto(user);
  }

  private seedUserDefaults(userId: number, now: string): void {
    this.database.userConfigs.push({
      id: this.database.nextId('userConfigs'),
      userId,
      darkMode: false,
      defaultTaskLimit: 10,
      createdAt: now,
      updatedAt: now,
    });

    const defaultColumns = [
      { title: 'Backlog', type: 'ARCHIVE' },
      { title: 'In Progress', type: 'NORMAL' },
      { title: 'Testing', type: 'NORMAL' },
      { title: 'Done', type: 'DONE' },
    ];
    for (let i = 0; i < defaultColumns.length; i++) {
      this.database.userStartupColumns.push({
        id: this.database.nextId('userStartupColumns'),
        userId,
        title: defaultColumns[i].title,
        position: i,
        type: defaultColumns[i].type,
        createdAt: now,
      });
    }

    const defaultTags = [
      { name: 'EASY', color: '#4CAF50' },
      { name: 'MEDIUM', color: '#FFC107' },
      { name: 'HARD', color: '#F44336' },
    ];
    for (let i = 0; i < defaultTags.length; i++) {
      this.database.userCustomTags.push({
        id: this.database.nextId('userCustomTags'),
        userId,
        name: defaultTags[i].name,
        color: defaultTags[i].color,
        position: i,
        createdAt: now,
      });
    }
  }

  private cascadeDeleteUser(userId: number): void {
    this.database.userConfigs = this.database.userConfigs.filter((c) => c.userId !== userId);
    this.database.userStartupColumns = this.database.userStartupColumns.filter((c) => c.userId !== userId);
    this.database.userCustomTags = this.database.userCustomTags.filter((t) => t.userId !== userId);
    this.database.taskAssignees = this.database.taskAssignees.filter((a) => a.userId !== userId);
    this.database.boardMembers = this.database.boardMembers.filter((m) => m.userId !== userId);

    const ownedBoardIds = new Set(
      this.database.boards.filter((b) => b.ownerId === userId).map((b) => b.id),
    );
    const ownedColumnIds = new Set(
      this.database.boardColumns.filter((c) => ownedBoardIds.has(c.boardId)).map((c) => c.id),
    );
    const ownedTaskIds = new Set(
      this.database.tasks.filter((t) => ownedColumnIds.has(t.columnId)).map((t) => t.id),
    );

    this.database.comments = this.database.comments.filter(
      (c) => !ownedTaskIds.has(c.taskId) && c.authorId !== userId,
    );
    this.database.taskAssignees = this.database.taskAssignees.filter((a) => !ownedTaskIds.has(a.taskId));
    this.database.tasks = this.database.tasks.filter(
      (t) => !ownedColumnIds.has(t.columnId) && t.reportedById !== userId,
    );
    this.database.boardColumns = this.database.boardColumns.filter((c) => !ownedBoardIds.has(c.boardId));
    this.database.boardMembers = this.database.boardMembers.filter((m) => !ownedBoardIds.has(m.boardId));
    this.database.boards = this.database.boards.filter((b) => !ownedBoardIds.has(b.id));
    this.database.users = this.database.users.filter((u) => u.id !== userId);
  }

  private deleteBoardData(boardId: number): void {
    const columnIds = new Set(
      this.database.boardColumns.filter((c) => c.boardId === boardId).map((c) => c.id),
    );
    const taskIds = new Set(
      this.database.tasks.filter((t) => columnIds.has(t.columnId)).map((t) => t.id),
    );
    this.database.comments = this.database.comments.filter((c) => !taskIds.has(c.taskId));
    this.database.taskAssignees = this.database.taskAssignees.filter((a) => !taskIds.has(a.taskId));
    this.database.tasks = this.database.tasks.filter((t) => !columnIds.has(t.columnId));
    this.database.boardColumns = this.database.boardColumns.filter((c) => c.boardId !== boardId);
    this.database.boardMembers = this.database.boardMembers.filter((m) => m.boardId !== boardId);
    this.database.boards = this.database.boards.filter((b) => b.id !== boardId);
  }

  private deleteColumnData(columnId: number): void {
    const taskIds = new Set(
      this.database.tasks.filter((t) => t.columnId === columnId).map((t) => t.id),
    );
    this.database.comments = this.database.comments.filter((c) => !taskIds.has(c.taskId));
    this.database.taskAssignees = this.database.taskAssignees.filter((a) => !taskIds.has(a.taskId));
    this.database.tasks = this.database.tasks.filter((t) => t.columnId !== columnId);
    this.database.boardColumns = this.database.boardColumns.filter((c) => c.id !== columnId);
  }

  private reindexCustomTags(userId: number): void {
    const tags = this.database.userCustomTags
      .filter((t) => t.userId === userId)
      .sort((a, b) => a.position - b.position);
    for (let i = 0; i < tags.length; i++) {
      tags[i].position = i;
    }
  }

  private getOrCreateUserConfig(userId: number): LocalUserConfig {
    const existing = this.database.userConfigs.find((c) => c.userId === userId);
    if (existing) {
      return existing;
    }
    const now = this.now();
    const config: LocalUserConfig = {
      id: this.database.nextId('userConfigs'),
      userId,
      darkMode: false,
      defaultTaskLimit: 10,
      createdAt: now,
      updatedAt: now,
    };
    this.database.userConfigs.push(config);
    return config;
  }

  private resolveTag(tagId: number | null, userId: number): number | null {
    if (tagId == null) {
      return null;
    }
    const tag = this.database.userCustomTags.find((t) => t.id === tagId && t.userId === userId);
    if (!tag) {
      throw LocalApiError.notFound('Custom tag not found');
    }
    return tag.id;
  }

  private setTaskAssignees(taskId: number, assigneeIds: number[]): void {
    const uniqueIds = [...new Set(assigneeIds)];
    for (const id of uniqueIds) {
      if (!this.database.users.some((u) => u.id === id)) {
        throw LocalApiError.notFound('One or more assignees were not found');
      }
    }
    this.database.taskAssignees = this.database.taskAssignees.filter((a) => a.taskId !== taskId);
    for (const userId of uniqueIds) {
      this.database.taskAssignees.push({ taskId, userId });
    }
  }

  private applyTaskPositions(columnId: number, items: ReorderItemInput[]): void {
    const positionById = new Map(items.map((i) => [i.id, i.position]));
    for (const task of this.database.tasks) {
      if (task.columnId !== columnId) {
        continue;
      }
      const position = positionById.get(task.id);
      if (position !== undefined) {
        task.position = position;
      }
    }
  }

  // ─── Permissions (mirrors BoardAuthorizationService) ─────────────────────

  private requireCurrentUser(currentUserId: number): LocalUser {
    if (!Number.isInteger(currentUserId) || currentUserId <= 0) {
      throw LocalApiError.unauthorized('Not authenticated');
    }
    const user = this.database.users.find((u) => u.id === currentUserId);
    if (!user) {
      throw LocalApiError.unauthorized('Not authenticated');
    }
    return user;
  }

  private isSuperAdmin(user: LocalUser): boolean {
    return user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
  }

  private isBoardMember(board: LocalBoard, user: LocalUser): boolean {
    return this.database.boardMembers.some(
      (m) => m.boardId === board.id && m.userId === user.id,
    );
  }

  private canReadBoard(board: LocalBoard, user: LocalUser): boolean {
    return this.isSuperAdmin(user) || board.ownerId === user.id || this.isBoardMember(board, user);
  }

  private assertCanReadBoard(board: LocalBoard, user: LocalUser): void {
    if (!this.canReadBoard(board, user)) {
      throw LocalApiError.forbidden('You do not have permission to access this board');
    }
  }

  private assertCanManageBoard(board: LocalBoard, user: LocalUser): void {
    if (!this.isSuperAdmin(user) && board.ownerId !== user.id) {
      throw LocalApiError.forbidden('Only board owner can manage this board');
    }
  }

  private assertCanManageColumn(board: LocalBoard, user: LocalUser): void {
    if (!this.isSuperAdmin(user) && board.ownerId !== user.id) {
      throw LocalApiError.forbidden('Only board owner can manage board columns');
    }
  }

  private assertCanCreateTask(board: LocalBoard, user: LocalUser): void {
    if (this.isSuperAdmin(user) || board.ownerId === user.id || this.isBoardMember(board, user)) {
      return;
    }
    throw LocalApiError.forbidden('You do not have permission to create tasks');
  }

  private assertCanManageTask(task: LocalTask, user: LocalUser): void {
    const board = this.getBoard(this.getColumn(task.columnId).boardId);
    if (this.isSuperAdmin(user) || board.ownerId === user.id || task.reportedById === user.id) {
      return;
    }
    throw LocalApiError.forbidden('Only the task creator can delete this task');
  }

  private assertCanCreateComment(board: LocalBoard, user: LocalUser): void {
    if (this.isSuperAdmin(user) || board.ownerId === user.id || this.isBoardMember(board, user)) {
      return;
    }
    throw LocalApiError.forbidden('You do not have permission to create comments');
  }

  private assertCanManageComment(comment: LocalComment, user: LocalUser): void {
    if (this.isSuperAdmin(user) || comment.authorId === user.id) {
      return;
    }
    throw LocalApiError.forbidden('Only the comment author can edit or delete this comment');
  }

  private assertIsBoardOwnerOrSuperAdmin(board: LocalBoard, user: LocalUser): void {
    if (!this.isSuperAdmin(user) && board.ownerId !== user.id) {
      throw LocalApiError.forbidden('Only the board owner can manage members');
    }
  }

  private assertCanManageUser(
    requestedUserId: number,
    currentUserId: number,
    message = 'You can only manage your own user account',
  ): void {
    const currentUser = this.requireCurrentUser(currentUserId);
    if (this.isSuperAdmin(currentUser)) {
      return;
    }
    if (currentUser.id !== requestedUserId) {
      throw LocalApiError.forbidden(message);
    }
  }

  private parseAssignableRole(role: string): string {
    const upper = role?.toUpperCase();
    if (upper !== 'INVITED' && upper !== 'VIEW_ONLY' && upper !== 'GUEST') {
      throw LocalApiError.conflict(
        `Role '${role}' cannot be assigned. Valid roles: INVITED, VIEW_ONLY, GUEST`,
      );
    }
    return upper;
  }

  // ─── Lookups ──────────────────────────────────────────────────────────────

  private getUser(userId: number): LocalUser {
    const user = this.database.users.find((u) => u.id === userId);
    if (!user) {
      throw LocalApiError.notFound('User not found');
    }
    return user;
  }

  private getBoard(boardId: number): LocalBoard {
    const board = this.database.boards.find((b) => b.id === boardId);
    if (!board) {
      throw LocalApiError.notFound('Board not found');
    }
    return board;
  }

  private getColumn(columnId: number): LocalBoardColumn {
    const column = this.database.boardColumns.find((c) => c.id === columnId);
    if (!column) {
      throw LocalApiError.notFound('Board column not found');
    }
    return column;
  }

  private getTask(taskId: number): LocalTask {
    const task = this.database.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw LocalApiError.notFound('Task not found');
    }
    return task;
  }

  private getExistingBoardColumn(boardId: number, columnId: number): LocalBoardColumn {
    const column = this.getColumn(columnId);
    if (column.boardId !== boardId) {
      throw LocalApiError.notFound('Board column not found');
    }
    return column;
  }

  private getExistingTask(columnId: number, taskId: number): LocalTask {
    const task = this.getTask(taskId);
    if (task.columnId !== columnId) {
      throw LocalApiError.notFound('Task not found');
    }
    return task;
  }

  private getExistingComment(taskId: number, commentId: number): LocalComment {
    const comment = this.database.comments.find((c) => c.id === commentId);
    if (!comment) {
      throw LocalApiError.notFound('Comment not found');
    }
    if (comment.taskId !== taskId) {
      throw LocalApiError.notFound('Comment not found');
    }
    return comment;
  }

  private getBoardMember(boardId: number, memberId: number): LocalBoardMember {
    const member = this.database.boardMembers.find((m) => m.id === memberId);
    if (!member) {
      throw LocalApiError.notFound('Board member not found');
    }
    if (member.boardId !== boardId) {
      throw LocalApiError.notFound('Board member not found on this board');
    }
    return member;
  }

  // ─── DTO mappers ──────────────────────────────────────────────────────────

  private toUserDto(user: LocalUser): AuthUserResponseDto {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private toBoardDto(board: LocalBoard): BoardResponseDto {
    return {
      id: board.id,
      title: board.title,
      description: board.description,
      ownerId: board.ownerId,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  }

  private toColumnDto(column: LocalBoardColumn): BoardColumnResponseDto {
    return {
      id: column.id,
      title: column.title,
      position: column.position,
      archived: column.archived,
      isDone: column.isDone,
      boardId: column.boardId,
      createdAt: column.createdAt,
    };
  }

  private toTaskDto(task: LocalTask): TaskResponseDto {
    const tag = task.tagId != null ? this.database.userCustomTags.find((t) => t.id === task.tagId) : undefined;
    const assigneeIds = this.database.taskAssignees
      .filter((a) => a.taskId === task.id)
      .map((a) => a.userId);
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      tagId: task.tagId,
      tagName: tag?.name ?? null,
      tagColor: tag?.color ?? null,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      position: task.position,
      done: task.done,
      columnId: task.columnId,
      reportedById: task.reportedById,
      assigneeIds,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  private toCommentDto(comment: LocalComment): CommentResponseDto {
    return {
      id: comment.id,
      content: comment.content,
      taskId: comment.taskId,
      authorId: comment.authorId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  private toMemberDto(member: LocalBoardMember): BoardMemberResponseDto {
    const user = this.database.users.find((u) => u.id === member.userId);
    return {
      id: member.id,
      boardId: member.boardId,
      userId: member.userId,
      email: user?.email ?? '',
      fullName: user?.fullName ?? '',
      role: member.role,
    };
  }

  private toStartupColumnDto(column: LocalStartupColumn): StartupColumnResponseDto {
    return {
      id: column.id,
      title: column.title,
      position: column.position,
      type: column.type,
    };
  }

  private toCustomTagDto(tag: LocalCustomTag): CustomTagResponseDto {
    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      position: tag.position,
    };
  }

  private toUserConfigDto(config: LocalUserConfig): UserConfigResponseDto {
    const startupColumns = this.database.userStartupColumns
      .filter((c) => c.userId === config.userId)
      .sort((a, b) => a.position - b.position)
      .map((c) => this.toStartupColumnDto(c));
    const customTags = this.database.userCustomTags
      .filter((t) => t.userId === config.userId)
      .sort((a, b) => a.position - b.position)
      .map((t) => this.toCustomTagDto(t));
    return {
      id: config.id,
      userId: config.userId,
      darkMode: config.darkMode,
      defaultTaskLimit: config.defaultTaskLimit,
      startupColumns,
      customTags,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}