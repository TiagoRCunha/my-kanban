import { Comment, UpdateCommentInput } from '../../entities/comment.entity';
import { CommentRepository } from '../../ports/comment-repository.port';

export class UpdateCommentUseCase {
  public constructor(private readonly commentRepository: CommentRepository) {}

  public execute(id: number, input: UpdateCommentInput): Promise<Comment> {
    return this.commentRepository.update(id, input);
  }
}
