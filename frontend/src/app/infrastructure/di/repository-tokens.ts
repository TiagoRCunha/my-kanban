import { InjectionToken } from '@angular/core';

import type {
  Column,
  CreateColumnInput,
  UpdateColumnInput,
} from '../../domain/board/entities/column.entity';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
} from '../../domain/board/entities/task.entity';
import type {
  Comment,
  CreateCommentInput,
  UpdateCommentInput,
} from '../../domain/board/entities/comment.entity';
import type { BoardRepository } from '../../domain/board/ports/board-repository.port';
import type { BoardMemberRepository } from '../../domain/board/ports/board-member-repository.port';
import type { UserRepository } from '../../domain/users/ports/user-repository.port';
import type { UserConfigRepositoryPort } from '../../domain/users/ports/user-config-repository.port';

/**
 * Application-level repository tokens. UI components and pages inject these
 * tokens and never the concrete adapters, so the storage backend (HTTP or
 * local veneer) is chosen once at bootstrap by `provideRepositoryVeneer`.
 */

/**
 * Veneer contract for columns. The domain `ColumnRepository` port is kept
 * idealized (it drives only the dead use-cases) while the UI needs the
 * board-scoped contract that both `HttpColumnRepository` and
 * `LocalColumnRepository` already implement.
 */
export interface BoardColumnRepository {
  findByBoardId(boardId: number): Promise<Column[]>;
  create(input: CreateColumnInput & { boardId: number }): Promise<Column>;
  update(id: number, input: UpdateColumnInput & { boardId: number }): Promise<Column>;
  delete(id: number, boardId: number): Promise<void>;
  reorder(boardId: number, items: { id: number; position: number }[]): Promise<void>;
}

/**
 * Veneer contract for tasks, mirroring the column-scoped API implemented by
 * both the HTTP and the local task adapters.
 */
export interface BoardTaskRepository {
  findByColumnId(columnId: number): Promise<Task[]>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: number, input: UpdateTaskInput & { columnId: number }): Promise<Task>;
  delete(id: number, columnId: number): Promise<void>;
  reorder(columnId: number, items: { id: number; position: number }[]): Promise<void>;
  moveTask(
    taskId: number,
    sourceColumnId: number,
    targetColumnId: number,
    position: number,
    reorderedSourceTasks: { id: number; position: number }[] | null,
    reorderedTargetTasks: { id: number; position: number }[],
  ): Promise<void>;
  markAsDone(taskId: number, columnId: number): Promise<Task>;
}

/**
 * Veneer contract for comments, mirroring the task-scoped API implemented by
 * both the HTTP and the local comment adapters.
 */
export interface BoardCommentRepository {
  findByTaskId(taskId: number): Promise<Comment[]>;
  create(input: CreateCommentInput): Promise<Comment>;
  update(id: number, input: UpdateCommentInput): Promise<Comment>;
  delete(id: number, taskId: number): Promise<void>;
}

export const USER_REPOSITORY = new InjectionToken<UserRepository>('USER_REPOSITORY');
export const BOARD_REPOSITORY = new InjectionToken<BoardRepository>('BOARD_REPOSITORY');
export const BOARD_MEMBER_REPOSITORY =
  new InjectionToken<BoardMemberRepository>('BOARD_MEMBER_REPOSITORY');
export const USER_CONFIG_REPOSITORY =
  new InjectionToken<UserConfigRepositoryPort>('USER_CONFIG_REPOSITORY');
export const COLUMN_REPOSITORY = new InjectionToken<BoardColumnRepository>('COLUMN_REPOSITORY');
export const TASK_REPOSITORY = new InjectionToken<BoardTaskRepository>('TASK_REPOSITORY');
export const COMMENT_REPOSITORY = new InjectionToken<BoardCommentRepository>('COMMENT_REPOSITORY');