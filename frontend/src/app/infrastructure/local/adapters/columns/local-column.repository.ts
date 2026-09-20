import type { LocalActorPort } from '../../../../domain/shared/ports/local-actor.port';
import type { LocalBackend } from '../../local-backend';
import {
  Column,
  type CreateColumnInput,
  type UpdateColumnInput,
} from '../../../../domain/board/entities/column.entity';
import { LocalColumnMapper } from './local-column.mapper';

/**
 * Local (desktop) adapter for board columns, backed by `LocalBackend`.
 * Every call resolves the acting user id from the given `LocalActorPort`,
 * mirroring how the JWT carries identity for the HTTP adapters. Mirrors the
 * `HttpColumnRepository` veneer contract (board-scoped, no standalone
 * `findById`).
 */
export class LocalColumnRepository {
  constructor(
    private readonly backend: LocalBackend,
    private readonly actor: LocalActorPort,
  ) {}

  public async findByBoardId(boardId: number): Promise<Column[]> {
    const actorId = await this.actor.resolveActorId();
    return LocalColumnMapper.toDomainMany(await this.backend.listColumns(actorId, boardId));
  }

  public async findById(_id: number): Promise<Column> {
    throw new Error('ColumnRepository.findById is not supported by the backend API');
  }

  public async create(input: CreateColumnInput & { boardId: number }): Promise<Column> {
    const actorId = await this.actor.resolveActorId();
    return LocalColumnMapper.toDomain(
      await this.backend.createColumn(actorId, input.boardId, {
        title: input.title,
        position: input.position,
        archived: input.archived,
        isDone: input.isDone,
      }),
    );
  }

  public async update(
    id: number,
    input: UpdateColumnInput & { boardId: number },
  ): Promise<Column> {
    const actorId = await this.actor.resolveActorId();
    return LocalColumnMapper.toDomain(
      await this.backend.updateColumn(actorId, input.boardId, id, {
        title: input.title,
        position: input.position,
        archived: input.archived,
        isDone: input.isDone,
      }),
    );
  }

  public async delete(id: number, boardId: number): Promise<void> {
    const actorId = await this.actor.resolveActorId();
    await this.backend.deleteColumn(actorId, boardId, id);
  }

  public async reorder(
    boardId: number,
    items: { id: number; position: number }[],
  ): Promise<void> {
    const actorId = await this.actor.resolveActorId();
    await this.backend.reorderColumns(actorId, boardId, items);
  }
}