import { APP_INITIALIZER, InjectionToken, type Provider } from '@angular/core';

import { LocalDatabase } from '../local-database';
import { LocalBackend } from '../local-backend';
import { createStorageDriver, detectStorageMode, type StorageMode } from '../storage/storage-driver.factory';
import type { StorageDriverPort } from '../storage/storage-driver.port';
import { LocalUserRepository } from '../adapters/users/local-user.repository';
import { LocalBoardRepository } from '../adapters/boards/local-board.repository';
import { LocalColumnRepository } from '../adapters/columns/local-column.repository';
import { LocalTaskRepository } from '../adapters/tasks/local-task.repository';
import { LocalCommentRepository } from '../adapters/comments/local-comment.repository';
import { LocalBoardMemberRepository } from '../adapters/board-members/local-board-member.repository';
import { LocalUserConfigRepository } from '../adapters/user-config/local-user-config.repository';
import { LocalSessionStore } from './session.store';
import { SessionLocalActor } from './session-local-actor';

/**
 * DI tokens and providers that wire the local (desktop/offline) veneer: a
 * `LocalBackend` sitting on a persistence driver chosen by storage mode, the
 * acting-user `LocalActorPort` behind a session store, and one repository
 * adapter per domain aggregate. All factories share the same backend and
 * actor, so switching to local mode is a single `provideLocalVeneer()` call.
 */

export const LOCAL_STORAGE_MODE = new InjectionToken<StorageMode>('LOCAL_STORAGE_MODE');
export const LOCAL_DRIVER = new InjectionToken<StorageDriverPort>('LOCAL_DRIVER');
export const LOCAL_DATABASE = new InjectionToken<LocalDatabase>('LOCAL_DATABASE');
export const LOCAL_BACKEND = new InjectionToken<LocalBackend>('LOCAL_BACKEND');
export const LOCAL_SESSION_STORE = new InjectionToken<LocalSessionStore>('LOCAL_SESSION_STORE');
export const LOCAL_ACTOR_PORT = new InjectionToken<SessionLocalActor>('LOCAL_ACTOR_PORT');
export const LOCAL_USER_REPOSITORY = new InjectionToken<LocalUserRepository>('LOCAL_USER_REPOSITORY');
export const LOCAL_BOARD_REPOSITORY = new InjectionToken<LocalBoardRepository>('LOCAL_BOARD_REPOSITORY');
export const LOCAL_COLUMN_REPOSITORY =
  new InjectionToken<LocalColumnRepository>('LOCAL_COLUMN_REPOSITORY');
export const LOCAL_TASK_REPOSITORY = new InjectionToken<LocalTaskRepository>('LOCAL_TASK_REPOSITORY');
export const LOCAL_COMMENT_REPOSITORY =
  new InjectionToken<LocalCommentRepository>('LOCAL_COMMENT_REPOSITORY');
export const LOCAL_BOARD_MEMBER_REPOSITORY =
  new InjectionToken<LocalBoardMemberRepository>('LOCAL_BOARD_MEMBER_REPOSITORY');
export const LOCAL_USER_CONFIG_REPOSITORY =
  new InjectionToken<LocalUserConfigRepository>('LOCAL_USER_CONFIG_REPOSITORY');

/**
 * The composable core of the veneer: the persistence driver, the database it
 * persists and the backend operating over that database. Used by the desktop
 * shell bootstrap and by tests.
 */
export type LocalVeneerStage = {
  driver: StorageDriverPort;
  database: LocalDatabase;
  backend: LocalBackend;
};

export function createLocalVeneer(mode: StorageMode = detectStorageMode()): LocalVeneerStage {
  const driver = createStorageDriver(mode);
  const database = LocalDatabase.createEmpty();
  const backend = new LocalBackend(database, { storage: driver });
  return { driver, database, backend };
}

/**
 * Restores a persisted snapshot from the driver into an existing empty
 * database, keeping the same instance while taking over the records and
 * identity sequences. No-op when the driver holds no snapshot yet.
 */
export async function hydrateLocalVeneer(
  database: LocalDatabase,
  driver: StorageDriverPort,
): Promise<void> {
  const snapshot = await driver.load();
  if (snapshot) {
    database.hydrate(snapshot);
  }
}

/**
 * Angular providers for the local veneer. The storage driver is picked by
 * storage mode (memory/browser/desktop) and the backend is hydrated from it
 * on app boot.
 */
export function provideLocalVeneer(mode: StorageMode = detectStorageMode()): Provider[] {
  return [
    { provide: LOCAL_STORAGE_MODE, useValue: mode },
    {
      provide: LOCAL_DRIVER,
      useFactory: (selectedMode: StorageMode) => createStorageDriver(selectedMode),
      deps: [LOCAL_STORAGE_MODE],
    },
    { provide: LOCAL_DATABASE, useFactory: () => LocalDatabase.createEmpty() },
    {
      provide: LOCAL_BACKEND,
      useFactory: (database: LocalDatabase, driver: StorageDriverPort) =>
        new LocalBackend(database, { storage: driver }),
      deps: [LOCAL_DATABASE, LOCAL_DRIVER],
    },
    { provide: LOCAL_SESSION_STORE, useClass: LocalSessionStore },
    {
      provide: LOCAL_ACTOR_PORT,
      useFactory: (session: LocalSessionStore) => new SessionLocalActor(session),
      deps: [LOCAL_SESSION_STORE],
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (database: LocalDatabase, driver: StorageDriverPort) => () =>
        hydrateLocalVeneer(database, driver),
      deps: [LOCAL_DATABASE, LOCAL_DRIVER],
      multi: true,
    },
    {
      provide: LOCAL_USER_REPOSITORY,
      useFactory: (backend: LocalBackend, actor: SessionLocalActor) =>
        new LocalUserRepository(backend, actor),
      deps: [LOCAL_BACKEND, LOCAL_ACTOR_PORT],
    },
    {
      provide: LOCAL_BOARD_REPOSITORY,
      useFactory: (backend: LocalBackend, actor: SessionLocalActor) =>
        new LocalBoardRepository(backend, actor),
      deps: [LOCAL_BACKEND, LOCAL_ACTOR_PORT],
    },
    {
      provide: LOCAL_COLUMN_REPOSITORY,
      useFactory: (backend: LocalBackend, actor: SessionLocalActor) =>
        new LocalColumnRepository(backend, actor),
      deps: [LOCAL_BACKEND, LOCAL_ACTOR_PORT],
    },
    {
      provide: LOCAL_TASK_REPOSITORY,
      useFactory: (backend: LocalBackend, actor: SessionLocalActor) =>
        new LocalTaskRepository(backend, actor),
      deps: [LOCAL_BACKEND, LOCAL_ACTOR_PORT],
    },
    {
      provide: LOCAL_COMMENT_REPOSITORY,
      useFactory: (backend: LocalBackend, actor: SessionLocalActor) =>
        new LocalCommentRepository(backend, actor),
      deps: [LOCAL_BACKEND, LOCAL_ACTOR_PORT],
    },
    {
      provide: LOCAL_BOARD_MEMBER_REPOSITORY,
      useFactory: (backend: LocalBackend, actor: SessionLocalActor) =>
        new LocalBoardMemberRepository(backend, actor),
      deps: [LOCAL_BACKEND, LOCAL_ACTOR_PORT],
    },
    {
      provide: LOCAL_USER_CONFIG_REPOSITORY,
      useFactory: (backend: LocalBackend, actor: SessionLocalActor) =>
        new LocalUserConfigRepository(backend, actor),
      deps: [LOCAL_BACKEND, LOCAL_ACTOR_PORT],
    },
  ];
}