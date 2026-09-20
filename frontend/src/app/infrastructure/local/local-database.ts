/**
 * Local database for the offline/desktop variant of My Kanban.
 *
 * Mirrors the PostgreSQL schema consolidated in migrations V1..V4 using
 * camelCase property names. Records are plain, serializable objects, which
 * lets the whole database be persisted as a single snapshot by a
 * {@link StorageDriver}.
 */

export const LOCAL_DATABASE_SCHEMA_VERSION = 1;

export type LocalDatabaseMeta = {
  schemaVersion: number;
};

/**
 * Mirrors the `users` table + the `email_verified` column added in V4.
 */
export type LocalUser = {
  id: number;
  fullName: string;
  email: string;
  passwordHash: string;
  avatarUrl: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Mirrors `user_configs` + the `default_task_limit` column added in V3.
 */
export type LocalUserConfig = {
  id: number;
  userId: number;
  darkMode: boolean;
  defaultTaskLimit: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * Mirrors `user_startup_columns` + the `type` column added in V2.
 */
export type LocalStartupColumn = {
  id: number;
  userId: number;
  title: string;
  position: number;
  type: string;
  createdAt: string;
};

/**
 * Mirrors `user_custom_tags`.
 */
export type LocalCustomTag = {
  id: number;
  userId: number;
  name: string;
  color: string;
  position: number;
  createdAt: string;
};

/**
 * Mirrors `boards`.
 */
export type LocalBoard = {
  id: number;
  title: string;
  description: string | null;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * Mirrors `board_columns` + the `archived` and `is_done` columns added in V2.
 */
export type LocalBoardColumn = {
  id: number;
  boardId: number;
  title: string;
  position: number;
  archived: boolean;
  isDone: boolean;
  createdAt: string;
};

/**
 * Mirrors `tasks` (priority and done are stored here even though the
 * frontend response DTO does not expose them).
 */
export type LocalTask = {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  dueDate: string | null;
  estimatedHours: number | null;
  position: number;
  columnId: number;
  reportedById: number;
  tagId: number | null;
  done: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Mirrors `task_assignees` (composite primary key, no own identity column).
 */
export type LocalTaskAssignee = {
  taskId: number;
  userId: number;
};

/**
 * Mirrors `comments`. `updatedAt` is not part of the SQL schema but the
 * frontend `CommentResponseDto` requires it, so it is maintained locally.
 */
export type LocalComment = {
  id: number;
  content: string;
  taskId: number;
  authorId: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * Mirrors `board_members`.
 */
export type LocalBoardMember = {
  id: number;
  boardId: number;
  userId: number;
  role: string;
};

/**
 * Tables that own an identity sequence. `task_assignees` is excluded because
 * its rows are identified by the composite `(taskId, userId)` pair.
 */
export type LocalTableName =
  | 'users'
  | 'userConfigs'
  | 'userStartupColumns'
  | 'userCustomTags'
  | 'boards'
  | 'boardColumns'
  | 'boardMembers'
  | 'tasks'
  | 'comments';

/**
 * A complete, JSON-serializable dump of the local database.
 */
export type LocalDatabaseSnapshot = {
  meta: LocalDatabaseMeta;
  users: LocalUser[];
  userConfigs: LocalUserConfig[];
  userStartupColumns: LocalStartupColumn[];
  userCustomTags: LocalCustomTag[];
  boards: LocalBoard[];
  boardColumns: LocalBoardColumn[];
  boardMembers: LocalBoardMember[];
  tasks: LocalTask[];
  taskAssignees: LocalTaskAssignee[];
  comments: LocalComment[];
  nextIds: Record<LocalTableName, number>;
};

const DEFAULT_NEXT_IDS: Record<LocalTableName, number> = {
  users: 1,
  userConfigs: 1,
  userStartupColumns: 1,
  userCustomTags: 1,
  boards: 1,
  boardColumns: 1,
  boardMembers: 1,
  tasks: 1,
  comments: 1,
};

/**
 * In-memory collection of records acting as the local counterpart of the
 * relational database. Created empty or restored from a snapshot; `serialize`
 * produces the persisted representation and `nextId` emulates each table's
 * identity sequence.
 */
export class LocalDatabase {
  public readonly meta: LocalDatabaseMeta;
  public users: LocalUser[] = [];
  public userConfigs: LocalUserConfig[] = [];
  public userStartupColumns: LocalStartupColumn[] = [];
  public userCustomTags: LocalCustomTag[] = [];
  public boards: LocalBoard[] = [];
  public boardColumns: LocalBoardColumn[] = [];
  public boardMembers: LocalBoardMember[] = [];
  public tasks: LocalTask[] = [];
  public taskAssignees: LocalTaskAssignee[] = [];
  public comments: LocalComment[] = [];

  private nextIds: Record<LocalTableName, number>;

  private constructor() {
    this.meta = { schemaVersion: LOCAL_DATABASE_SCHEMA_VERSION };
    this.nextIds = { ...DEFAULT_NEXT_IDS };
  }

  public static createEmpty(): LocalDatabase {
    return new LocalDatabase();
  }

  public static fromSnapshot(snapshot: LocalDatabaseSnapshot): LocalDatabase {
    if (!snapshot?.meta || snapshot.meta.schemaVersion !== LOCAL_DATABASE_SCHEMA_VERSION) {
      const version = snapshot?.meta?.schemaVersion ?? 'missing';
      throw new Error(
        `Unsupported local database schema version (expected ${LOCAL_DATABASE_SCHEMA_VERSION}, got ${version})`,
      );
    }

    const database = new LocalDatabase();
    database.users = snapshot.users ?? [];
    database.userConfigs = snapshot.userConfigs ?? [];
    database.userStartupColumns = snapshot.userStartupColumns ?? [];
    database.userCustomTags = snapshot.userCustomTags ?? [];
    database.boards = snapshot.boards ?? [];
    database.boardColumns = snapshot.boardColumns ?? [];
    database.boardMembers = snapshot.boardMembers ?? [];
    database.tasks = snapshot.tasks ?? [];
    database.taskAssignees = snapshot.taskAssignees ?? [];
    database.comments = snapshot.comments ?? [];
    database.nextIds = { ...DEFAULT_NEXT_IDS, ...(snapshot.nextIds ?? {}) };
    return database;
  }

  /**
   * Restores the state of an existing instance from a snapshot, replacing the
   * current records and identity sequences in place. Used by the desktop DI
   * bootstrapping to reuse the same `LocalDatabase` instance while hydrating
   * it from a persisted storage driver.
   */
  public hydrate(snapshot: LocalDatabaseSnapshot): void {
    if (!snapshot?.meta || snapshot.meta.schemaVersion !== LOCAL_DATABASE_SCHEMA_VERSION) {
      const version = snapshot?.meta?.schemaVersion ?? 'missing';
      throw new Error(
        `Unsupported local database schema version (expected ${LOCAL_DATABASE_SCHEMA_VERSION}, got ${version})`,
      );
    }

    this.users = snapshot.users ?? [];
    this.userConfigs = snapshot.userConfigs ?? [];
    this.userStartupColumns = snapshot.userStartupColumns ?? [];
    this.userCustomTags = snapshot.userCustomTags ?? [];
    this.boards = snapshot.boards ?? [];
    this.boardColumns = snapshot.boardColumns ?? [];
    this.boardMembers = snapshot.boardMembers ?? [];
    this.tasks = snapshot.tasks ?? [];
    this.taskAssignees = snapshot.taskAssignees ?? [];
    this.comments = snapshot.comments ?? [];
    this.nextIds = { ...DEFAULT_NEXT_IDS, ...(snapshot.nextIds ?? {}) };
  }

  /**
   * Returns an independent snapshot of the current state. The returned value
   * is safe to stringify or mutate without affecting the live database.
   */
  public serialize(): LocalDatabaseSnapshot {
    return {
      meta: { schemaVersion: this.meta.schemaVersion },
      users: [...this.users],
      userConfigs: [...this.userConfigs],
      userStartupColumns: [...this.userStartupColumns],
      userCustomTags: [...this.userCustomTags],
      boards: [...this.boards],
      boardColumns: [...this.boardColumns],
      boardMembers: [...this.boardMembers],
      tasks: [...this.tasks],
      taskAssignees: [...this.taskAssignees],
      comments: [...this.comments],
      nextIds: { ...this.nextIds },
    };
  }

  /**
   * Emulates an identity sequence: returns the next id for the table and
   * advances the internal counter.
   */
  public nextId(table: LocalTableName): number {
    const id = this.nextIds[table];
    this.nextIds[table] = id + 1;
    return id;
  }
}