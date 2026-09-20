import { Comment } from '../../../../domain/board/entities/comment.entity';
import type { CommentResponseDto } from '../../../board/dto/comment.dto';

/**
 * Maps the local (desktop) comment DTO returned by `LocalBackend` into the
 * domain `Comment` aggregate. The local backend persists snapshot-shaped
 * rows, mirroring the HTTP `CommentMapper.toDomain`.
 */
export class LocalCommentMapper {
  public static toDomain(dto: CommentResponseDto): Comment {
    return Comment.fromSnapshot({
      id: dto.id,
      content: dto.content,
      taskId: dto.taskId,
      authorId: dto.authorId,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public static toDomainMany(dtos: CommentResponseDto[]): Comment[] {
    return dtos.map((dto) => LocalCommentMapper.toDomain(dto));
  }
}