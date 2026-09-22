import type { Provider } from '@angular/core';

import { HttpUserRepository } from '../users/adapters/http-user.repository';
import { HttpBoardRepository } from '../board/adapters/http-board.repository';
import { HttpBoardMemberRepository } from '../board/adapters/http-board-member.repository';
import { HttpColumnRepository } from '../board/adapters/http-column.repository';
import { HttpTaskRepository } from '../board/adapters/task-http.repository';
import { HttpCommentRepository } from '../board/adapters/http-comment.repository';
import { HttpUserConfigAdapter } from '../user-config/adapters/http-user-config.adapter';

import {
  LOCAL_BOARD_MEMBER_REPOSITORY,
  LOCAL_BOARD_REPOSITORY,
  LOCAL_COLUMN_REPOSITORY,
  LOCAL_COMMENT_REPOSITORY,
  LOCAL_TASK_REPOSITORY,
  LOCAL_USER_CONFIG_REPOSITORY,
  LOCAL_USER_REPOSITORY,
  provideLocalVeneer,
} from '../local/di/local-veneer.providers';
import { seedLocalSession } from '../local/di/desktop-seed';
import type { StorageMode } from '../local/storage/storage-driver.factory';

import {
  BOARD_MEMBER_REPOSITORY,
  BOARD_REPOSITORY,
  COLUMN_REPOSITORY,
  COMMENT_REPOSITORY,
  TASK_REPOSITORY,
  USER_CONFIG_REPOSITORY,
  USER_REPOSITORY,
} from './repository-tokens';

/**
 * Which repository family the application should use. `http` is the normal
 * web application (Spring Boot REST API). `memory`, `browser` and `desktop`
 * select the local veneer, which is only exposed to the desktop shell.
 */
export type RepositoryVeneerMode = 'http' | StorageMode;

/**
 * Feature flag that selects the repository implementation for the whole
 * application at bootstrap:
 *
 * - `http` (default, web app): every token resolves to the root HTTP adapter.
 * - `desktop`: local adapters over a shared `LocalBackend` + an in-memory
 *   session, hydrated from the disk snapshot through the Electron bridge.
 * - `memory` / `browser`: the same local veneer for tests and local-storage
 *   builds.
 */
export function provideRepositoryVeneer(mode: RepositoryVeneerMode = 'http'): Provider[] {
  if (mode === 'http') {
    return provideHttpRepositoryVeneer();
  }

  return provideLocalRepositoryVeneer(mode);
}

function provideHttpRepositoryVeneer(): Provider[] {
  return [
    { provide: USER_REPOSITORY, useExisting: HttpUserRepository },
    { provide: BOARD_REPOSITORY, useExisting: HttpBoardRepository },
    { provide: BOARD_MEMBER_REPOSITORY, useExisting: HttpBoardMemberRepository },
    { provide: USER_CONFIG_REPOSITORY, useExisting: HttpUserConfigAdapter },
    { provide: COLUMN_REPOSITORY, useExisting: HttpColumnRepository },
    { provide: TASK_REPOSITORY, useExisting: HttpTaskRepository },
    { provide: COMMENT_REPOSITORY, useExisting: HttpCommentRepository },
  ];
}

function provideLocalRepositoryVeneer(mode: StorageMode): Provider[] {
  return [
    ...provideLocalVeneer(mode, mode === 'desktop' ? seedLocalSession : undefined),
    { provide: USER_REPOSITORY, useExisting: LOCAL_USER_REPOSITORY },
    { provide: BOARD_REPOSITORY, useExisting: LOCAL_BOARD_REPOSITORY },
    { provide: BOARD_MEMBER_REPOSITORY, useExisting: LOCAL_BOARD_MEMBER_REPOSITORY },
    { provide: USER_CONFIG_REPOSITORY, useExisting: LOCAL_USER_CONFIG_REPOSITORY },
    { provide: COLUMN_REPOSITORY, useExisting: LOCAL_COLUMN_REPOSITORY },
    { provide: TASK_REPOSITORY, useExisting: LOCAL_TASK_REPOSITORY },
    { provide: COMMENT_REPOSITORY, useExisting: LOCAL_COMMENT_REPOSITORY },
  ];
}