import type { LocalActorPort } from '../../../../domain/shared/ports/local-actor.port';
import type { LocalBackend } from '../../local-backend';
import {
  BoardMember,
  type BoardMemberRole,
  type InviteMemberInput,
} from '../../../../domain/board/entities/board-member.entity';
import { LocalBoardMemberMapper } from './local-board-member.mapper';

/**
 * Local (desktop) adapter for board members, backed by `LocalBackend`. Every
 * call resolves the acting user id from the given `LocalActorPort`, mirroring
 * how the JWT carries identity for the HTTP adapters. Mirrors the
 * `HttpBoardMemberRepository` veneer contract exactly.
 */
export class LocalBoardMemberRepository {
  constructor(
    private readonly backend: LocalBackend,
    private readonly actor: LocalActorPort,
  ) {}

  public async listMembers(boardId: number): Promise<BoardMember[]> {
    const actorId = await this.actor.resolveActorId();
    return LocalBoardMemberMapper.toDomainMany(await this.backend.listMembers(actorId, boardId));
  }

  public async inviteMember(boardId: number, input: InviteMemberInput): Promise<BoardMember> {
    const actorId = await this.actor.resolveActorId();
    return LocalBoardMemberMapper.toDomain(
      await this.backend.inviteMember(actorId, boardId, {
        email: input.email,
        role: input.role,
      }),
    );
  }

  public async updateMemberRole(
    boardId: number,
    memberId: number,
    role: BoardMemberRole,
  ): Promise<BoardMember> {
    const actorId = await this.actor.resolveActorId();
    return LocalBoardMemberMapper.toDomain(
      await this.backend.updateMemberRole(actorId, boardId, memberId, role),
    );
  }

  public async removeMember(boardId: number, memberId: number): Promise<void> {
    const actorId = await this.actor.resolveActorId();
    await this.backend.removeMember(actorId, boardId, memberId);
  }
}