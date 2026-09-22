import { Injector } from '@angular/core';

import { LocalDatabase } from '../local-database';
import { LocalBackend } from '../local-backend';
import { InMemoryStorageDriver } from '../storage/in-memory.storage-driver';
import { LocalSessionStore } from './session.store';
import { SessionLocalActor } from './session-local-actor';
import { LocalUserRepository } from '../adapters/users/local-user.repository';
import { LocalBoardRepository } from '../adapters/boards/local-board.repository';
import {
  createLocalVeneer,
  hydrateLocalVeneer,
  provideLocalVeneer,
  LOCAL_DATABASE,
  LOCAL_BACKEND,
  LOCAL_ACTOR_PORT,
  LOCAL_SESSION_STORE,
  LOCAL_USER_REPOSITORY,
  LOCAL_BOARD_REPOSITORY,
  LOCAL_COLUMN_REPOSITORY,
  LOCAL_TASK_REPOSITORY,
  LOCAL_COMMENT_REPOSITORY,
  LOCAL_BOARD_MEMBER_REPOSITORY,
  LOCAL_USER_CONFIG_REPOSITORY,
} from './local-veneer.providers';
import type { LocalActorPort } from '../../../domain/shared/ports/local-actor.port';

const NOW = '2026-09-20T10:00:00.000Z';

function seedOwner(database: LocalDatabase): void {
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
}

describe('LocalSessionStore', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('stores and returns the id of the current local user', () => {
    const store = new LocalSessionStore();

    store.setUserId(1);

    expect(store.getUserId()).toBe(1);
  });

  it('returns null when no session has been established', () => {
    expect(new LocalSessionStore().getUserId()).toBeNull();
  });

  it('clears the stored session', () => {
    const store = new LocalSessionStore();
    store.setUserId(1);

    store.clear();

    expect(store.getUserId()).toBeNull();
  });
});

describe('SessionLocalActor', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('resolves the id of the stored session user', async () => {
    const store = new LocalSessionStore();
    store.setUserId(1);
    const actor = new SessionLocalActor(store);

    await expectAsync(actor.resolveActorId()).toBeResolvedTo(1);
  });

  it('is not authenticated until a session exists', () => {
    const actor = new SessionLocalActor(new LocalSessionStore());

    expect(actor.isAuthenticated).toBe(false);

    const store = new LocalSessionStore();
    store.setUserId(1);
    expect(new SessionLocalActor(store).isAuthenticated).toBe(true);
  });

  it('rejects when no session is established', async () => {
    const actor = new SessionLocalActor(new LocalSessionStore());

    await expectAsync(actor.resolveActorId()).toBeRejectedWithError(/No local session/);
  });
});

describe('createLocalVeneer', () => {
  it('wires the backend and the database together for the given mode', () => {
    const veneer = createLocalVeneer('memory');

    expect(veneer.backend).toBeInstanceOf(LocalBackend);
    expect((veneer.backend as LocalBackend).database).toBe(veneer.database);
    expect(veneer.driver).toBeInstanceOf(InMemoryStorageDriver);
  });

  it('operates over the returned database', async () => {
    const veneer = createLocalVeneer('memory');
    seedOwner(veneer.database);

    const users = await veneer.backend.listUsers(1);

    expect(users.map((u) => u.email)).toEqual(['owner@local.test']);
  });
});

describe('hydrateLocalVeneer', () => {
  it('restores a persisted snapshot into the database in place', async () => {
    const source = createLocalVeneer('memory');
    seedOwner(source.database);

    const target = createLocalVeneer('memory');
    await target.driver.save(source.database.serialize());
    const database = LocalDatabase.createEmpty();

    await hydrateLocalVeneer(database, target.driver);

    expect(database.users.length).toBe(1);
    expect(database.nextId('users')).toBe(2);
  });

  it('leaves the database empty when the driver has no snapshot', async () => {
    const database = LocalDatabase.createEmpty();

    await hydrateLocalVeneer(database, new InMemoryStorageDriver());

    expect(database.users).toEqual([]);
  });
});

describe('provideLocalVeneer', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('provides a singleton backend and database', () => {
    const injector = Injector.create({ providers: provideLocalVeneer('memory') });

    expect(injector.get(LOCAL_BACKEND)).toBe(injector.get(LOCAL_BACKEND));
    expect(injector.get(LOCAL_DATABASE)).toBe(injector.get(LOCAL_DATABASE));
  });

  it('resolves all repository factories wired to the backend and actor', () => {
    const injector = Injector.create({ providers: provideLocalVeneer('memory') });

    expect(injector.get(LOCAL_USER_REPOSITORY)).toBeInstanceOf(LocalUserRepository);
    expect(injector.get(LOCAL_BOARD_REPOSITORY)).toBeInstanceOf(LocalBoardRepository);
    expect(injector.get(LOCAL_COLUMN_REPOSITORY)).not.toBeNull();
    expect(injector.get(LOCAL_TASK_REPOSITORY)).not.toBeNull();
    expect(injector.get(LOCAL_COMMENT_REPOSITORY)).not.toBeNull();
    expect(injector.get(LOCAL_BOARD_MEMBER_REPOSITORY)).not.toBeNull();
    expect(injector.get(LOCAL_USER_CONFIG_REPOSITORY)).not.toBeNull();
  });

  it('binds the actor to the shared session store of the injector', async () => {
    const injector = Injector.create({ providers: provideLocalVeneer('memory') });

    injector.get(LOCAL_SESSION_STORE).setUserId(1);
    const actor = injector.get(LOCAL_ACTOR_PORT) as LocalActorPort;

    await expectAsync(actor.resolveActorId()).toBeResolvedTo(1);
  });

  it('runs repository calls against the resolved session actor', async () => {
    const injector = Injector.create({ providers: provideLocalVeneer('memory') });
    seedOwner(injector.get(LOCAL_DATABASE));
    injector.get(LOCAL_SESSION_STORE).setUserId(1);

    const userRepository = injector.get(LOCAL_USER_REPOSITORY) as LocalUserRepository;
    await userRepository.create({
      fullName: 'Newbie',
      email: 'new@local.test',
      passwordHash: 'password',
    });

const users = await userRepository.findAll();
      expect(users.map((u) => u.email.value)).toEqual(['owner@local.test', 'new@local.test']);
  });

  it('rejects repository calls before a session is established', async () => {
    const injector = Injector.create({ providers: provideLocalVeneer('memory') });

    const boardRepository = injector.get(LOCAL_BOARD_REPOSITORY) as LocalBoardRepository;

    await expectAsync(
      boardRepository.create({ title: 'Ghost Board', description: null, ownerId: 1 }),
    ).toBeRejectedWithError(/No local session/);
  });
});