import type { LocalActorPort } from '../../../../domain/shared/ports/local-actor.port';
import type { LocalBackend } from '../../local-backend';
import {
  Comment,
  type CreateCommentInput,
  type UpdateCommentInput,
} from '../../../../domain/board/entities/comment.entity';
import { LocalCommentMapper } from './local-comment.mapper';

/**
 * Local (desktop) adapter for comments, backed by `LocalBackend`. Every call
 * resolves the acting user id from the given `LocalActorPort`, mirroring how
 * the JWT carries identity for the HTTP adapters. Mirrors the
 * `HttpCommentRepository` veneer contract (task-scoped, no standalone
 * `findById`). The author of a new comment is always the acting user.
 */
export class LocalCommentRepository {
  constructor(
    private readonly backend: LocalBackend,
    private readonly actor: LocalActorPort,
  ) {}

  public async findByTaskId(taskId: number): Promise<Comment[]> {
    const actorId = await this.actor.resolveActorId();
    return LocalCommentMapper.toDomainMany(await this.backend.listComments(actorId, taskId));
  }

  public async findById(_id: number): Promise<Comment> {
    throw new Error('CommentRepository.findById is not supported by the backend API');
  }

  public async create(input: CreateCommentInput): Promise<Comment> {
    const actorId = await this.actor.resolveActorId();
    return LocalCommentMapper.toDomain(
      await this.backend.createComment(actorId, input.taskId, input.content),
    );
  }

  public async update(id: number, input: UpdateCommentInput): Promise<Comment> {
    const actorId = await this.actor.resolveActorId();
    return LocalCommentMapper.toDomain(
      await this.backend.updateComment(actorId, input.taskId, id, input.content),
    );
  }

  public async delete(id: number, taskId: number): Promise<void> {
    const actorId = await this.actor.resolveActorId();
    await this.backend.deleteComment(actorId, taskId, id);
  }
}