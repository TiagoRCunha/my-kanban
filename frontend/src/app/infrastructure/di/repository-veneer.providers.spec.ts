import { EnvironmentInjector, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { provideRepositoryVeneer } from './repository-veneer.providers';
import {
  BOARD_MEMBER_REPOSITORY,
  BOARD_REPOSITORY,
  COLUMN_REPOSITORY,
  COMMENT_REPOSITORY,
  TASK_REPOSITORY,
  USER_CONFIG_REPOSITORY,
  USER_REPOSITORY,
} from './repository-tokens';

import { HttpUserRepository } from '../users/adapters/http-user.repository';
import { HttpBoardRepository } from '../board/adapters/http-board.repository';
import { HttpBoardMemberRepository } from '../board/adapters/http-board-member.repository';
import { HttpColumnRepository } from '../board/adapters/http-column.repository';
import { HttpTaskRepository } from '../board/adapters/task-http.repository';
import { HttpCommentRepository } from '../board/adapters/http-comment.repository';
import { HttpUserConfigAdapter } from '../user-config/adapters/http-user-config.adapter';

import { LocalUserRepository } from '../local/adapters/users/local-user.repository';
import { LocalBoardRepository } from '../local/adapters/boards/local-board.repository';
import { LocalBoardMemberRepository } from '../local/adapters/board-members/local-board-member.repository';
import { LocalColumnRepository } from '../local/adapters/columns/local-column.repository';
import { LocalTaskRepository } from '../local/adapters/tasks/local-task.repository';
import { LocalCommentRepository } from '../local/adapters/comments/local-comment.repository';
import { LocalUserConfigRepository } from '../local/adapters/user-config/local-user-config.repository';

import {
  LOCAL_BACKEND,
  LOCAL_DATABASE,
  LOCAL_SESSION_STORE,
} from '../local/di/local-veneer.providers';
import type { LocalDatabaseSnapshot } from '../local/local-database';

type BridgeApi = {
  loadSnapshot(): Promise<LocalDatabaseSnapshot | null>;
  saveSnapshot(snapshot: LocalDatabaseSnapshot): Promise<void>;
};

const NOW = '2026-09-20T10:00:00.000Z';

async function loadSnapshot(): Promise<LocalDatabaseSnapshot | null> {
  return null;
}

async function saveSnapshot(snapshot: LocalDatabaseSnapshot): Promise<void> {}

describe('provideRepositoryVeneer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    delete (window as Window & { api?: BridgeApi }).api;
    localStorage.clear();
  });

  it('binds every token to the HTTP adapters in the http mode', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRepositoryVeneer('http'),
      ],
    }).compileComponents();

    const injector = TestBed.inject(EnvironmentInjector);

    expect(injector.get(USER_REPOSITORY)).toBeInstanceOf(HttpUserRepository);
    expect(injector.get(BOARD_REPOSITORY)).toBeInstanceOf(HttpBoardRepository);
    expect(injector.get(BOARD_MEMBER_REPOSITORY)).toBeInstanceOf(HttpBoardMemberRepository);
    expect(injector.get(USER_CONFIG_REPOSITORY)).toBeInstanceOf(HttpUserConfigAdapter);
    expect(injector.get(COLUMN_REPOSITORY)).toBeInstanceOf(HttpColumnRepository);
    expect(injector.get(TASK_REPOSITORY)).toBeInstanceOf(HttpTaskRepository);
    expect(injector.get(COMMENT_REPOSITORY)).toBeInstanceOf(HttpCommentRepository);
  });

  it('binds every token to the local adapters in the desktop mode', () => {
    (window as Window & { api?: BridgeApi }).api = { loadSnapshot, saveSnapshot };

    const injector = Injector.create({ providers: provideRepositoryVeneer('desktop') });

    expect(injector.get(USER_REPOSITORY)).toBeInstanceOf(LocalUserRepository);
    expect(injector.get(BOARD_REPOSITORY)).toBeInstanceOf(LocalBoardRepository);
    expect(injector.get(BOARD_MEMBER_REPOSITORY)).toBeInstanceOf(LocalBoardMemberRepository);
    expect(injector.get(USER_CONFIG_REPOSITORY)).toBeInstanceOf(LocalUserConfigRepository);
    expect(injector.get(COLUMN_REPOSITORY)).toBeInstanceOf(LocalColumnRepository);
    expect(injector.get(TASK_REPOSITORY)).toBeInstanceOf(LocalTaskRepository);
    expect(injector.get(COMMENT_REPOSITORY)).toBeInstanceOf(LocalCommentRepository);
  });

  it('binds every token to the local adapters in the memory mode', () => {
    const injector = Injector.create({ providers: provideRepositoryVeneer('memory') });

    expect(injector.get(USER_REPOSITORY)).toBeInstanceOf(LocalUserRepository);
    expect(injector.get(BOARD_REPOSITORY)).toBeInstanceOf(LocalBoardRepository);
    expect(injector.get(BOARD_MEMBER_REPOSITORY)).toBeInstanceOf(LocalBoardMemberRepository);
    expect(injector.get(USER_CONFIG_REPOSITORY)).toBeInstanceOf(LocalUserConfigRepository);
    expect(injector.get(COLUMN_REPOSITORY)).toBeInstanceOf(LocalColumnRepository);
    expect(injector.get(TASK_REPOSITORY)).toBeInstanceOf(LocalTaskRepository);
    expect(injector.get(COMMENT_REPOSITORY)).toBeInstanceOf(LocalCommentRepository);
  });

  it('routes all local adapters through one shared backend and database', async () => {
    const injector = Injector.create({ providers: provideRepositoryVeneer('memory') });
    const database = injector.get(LOCAL_DATABASE);
    const session = injector.get(LOCAL_SESSION_STORE);
    database.nextId('users');
    database.users.push({
      id: 1,
      fullName: 'Local Owner',
      email: 'owner@local.test',
      passwordHash: 'owner-hash',
      avatarUrl: null,
      role: 'ADMIN',
      emailVerified: true,
      createdAt: NOW,
      updatedAt: NOW,
    });
    session.setUserId(1);

    const userRepository = injector.get(USER_REPOSITORY) as LocalUserRepository;
    await userRepository.create({
      fullName: 'Newbie',
      email: 'new@local.test',
      passwordHash: 'password',
    });

    const boardRepository = injector.get(BOARD_REPOSITORY) as LocalBoardRepository;
    const board = await boardRepository.create({ title: 'Shared Board', description: null, ownerId: 1 });

    expect(injector.get(LOCAL_BACKEND)).toBeDefined();
    expect(database.users).toHaveSize(2);
    expect(database.boards).toEqual([jasmine.objectContaining({ id: 1, title: 'Shared Board', ownerId: 1 })]);
    expect(board.ownerId).toBe(1);
  });
});