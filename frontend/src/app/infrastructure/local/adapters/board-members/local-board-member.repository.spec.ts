import { LocalDatabase } from '../../local-database';
import { InMemoryStorageDriver } from '../../storage/in-memory.storage-driver';
import { LocalBackend } from '../../local-backend';
import { LocalBoardMemberRepository } from './local-board-member.repository';
import { StaticLocalActor } from '../users/static-local-actor';

describe('LocalBoardMemberRepository (DI veneer)', () => {
  let database: LocalDatabase;
  let backend: LocalBackend;
  let repository: LocalBoardMemberRepository;

  const NOW = '2026-09-20T10:00:00.000Z';

  beforeEach(() => {
    database = LocalDatabase.createEmpty();
    backend = new LocalBackend(database, {
      storage: new InMemoryStorageDriver(),
    });
    repository = new LocalBoardMemberRepository(backend, new StaticLocalActor(1));
  });

  /** Seeds the acting owner (id 1) and consumes its id from the users sequence. */
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

  /** Seeds a second user (id 2) that can be invited to a board. */
  function seedInvitee(): void {
    database.users.push({
      id: database.nextId('users'),
      fullName: 'Invitee',
      email: 'invitee@local.test',
      passwordHash: 'invitee-hash',
      avatarUrl: null,
      role: 'USER',
      emailVerified: true,
      createdAt: NOW,
      updatedAt: NOW,
    });
  }

  describe('listMembers', () => {
    it('returns the members of the board', async () => {
      seedOwner();
      seedInvitee();
      const boardId = seedBoard();

      await repository.inviteMember(boardId, { email: 'invitee@local.test', role: 'GUEST' });

      const members = await repository.listMembers(boardId);

      expect(members.map((m) => m.email)).toEqual(['invitee@local.test']);
    });
  });

  describe('inviteMember', () => {
    it('invites an existing user to the board', async () => {
      seedOwner();
      seedInvitee();
      const boardId = seedBoard();

      const member = await repository.inviteMember(boardId, {
        email: 'invitee@local.test',
        role: 'GUEST',
      });

      expect(member.email).toBe('invitee@local.test');
      expect(member.role).toBe('GUEST');
    });

    it('rejects an unknown email', async () => {
      seedOwner();
      const boardId = seedBoard();

      await expectAsync(
        repository.inviteMember(boardId, { email: 'ghost@local.test', role: 'GUEST' }),
      ).toBeRejected();
    });
  });

  describe('updateMemberRole', () => {
    it('changes the role of an existing member', async () => {
      seedOwner();
      seedInvitee();
      const boardId = seedBoard();
      const member = await repository.inviteMember(boardId, {
        email: 'invitee@local.test',
        role: 'GUEST',
      });

      const updated = await repository.updateMemberRole(boardId, member.id, 'VIEW_ONLY');

      expect(updated.role).toBe('VIEW_ONLY');
      expect(updated.id).toBe(member.id);
    });
  });

  describe('removeMember', () => {
    it('removes the member from the board', async () => {
      seedOwner();
      seedInvitee();
      const boardId = seedBoard();
      const member = await repository.inviteMember(boardId, {
        email: 'invitee@local.test',
        role: 'GUEST',
      });

      await repository.removeMember(boardId, member.id);

      const members = await repository.listMembers(boardId);
      expect(members.length).toBe(0);
    });
  });
});