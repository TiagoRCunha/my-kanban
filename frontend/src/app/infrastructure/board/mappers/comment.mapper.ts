import { Comment, CommentCommand } from '../../../domain/board/entities/comment.entity';
import { CommentRequestDto, CommentResponseDto } from '../dto/comment.dto';

export class CommentMapper {
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

  public static toRequestDto(command: CommentCommand): CommentRequestDto {
    return {
      content: command.content,
    };
  }
}
