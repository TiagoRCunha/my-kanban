import type { LocalActorPort } from '../../../../domain/shared/ports/local-actor.port';
import type { LocalBackend } from '../../local-backend';
import {
  Board,
  type CreateBoardInput,
  type UpdateBoardInput,
} from '../../../../domain/board/entities/board.entity';
import { BoardRepository } from '../../../../domain/board/ports/board-repository.port';
import { LocalBoardMapper } from './local-board.mapper';

/**
 * Local (desktop) adapter for the board repository, backed by `LocalBackend`.
 * Every call resolves the acting user id from the given `LocalActorPort`,
 * mirroring how the JWT carries identity for the HTTP adapters. The backend
 * derives `ownerId` from the acting user, matching the HTTP create/update
 * behaviour where the request DTO carries no owner.
 */
export class LocalBoardRepository implements BoardRepository {
  constructor(
    private readonly backend: LocalBackend,
    private readonly actor: LocalActorPort,
  ) {}

  public async findAll(): Promise<Board[]> {
    const actorId = await this.actor.resolveActorId();
    return LocalBoardMapper.toDomainMany(await this.backend.listBoards(actorId));
  }

  public async findById(id: number): Promise<Board> {
    const actorId = await this.actor.resolveActorId();
    return LocalBoardMapper.toDomain(await this.backend.findBoardById(actorId, id));
  }

  public async create(input: CreateBoardInput): Promise<Board> {
    const actorId = await this.actor.resolveActorId();
    return LocalBoardMapper.toDomain(
      await this.backend.createBoard(actorId, {
        title: input.title,
        description: input.description ?? null,
      }),
    );
  }

  public async update(id: number, input: UpdateBoardInput): Promise<Board> {
    const actorId = await this.actor.resolveActorId();
    return LocalBoardMapper.toDomain(
      await this.backend.updateBoard(actorId, id, {
        title: input.title,
        description: input.description ?? null,
      }),
    );
  }

  public async delete(id: number): Promise<void> {
    const actorId = await this.actor.resolveActorId();
    await this.backend.deleteBoard(actorId, id);
  }

  public async leaveBoard(id: number): Promise<void> {
    const actorId = await this.actor.resolveActorId();
    await this.backend.leaveBoard(actorId, id);
  }
}