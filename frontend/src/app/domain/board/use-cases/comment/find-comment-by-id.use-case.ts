import { Comment } from '../../entities/comment.entity';
import { CommentRepository } from '../../ports/comment-repository.port';

export class FindCommentByIdUseCase {
  public constructor(private readonly commentRepository: CommentRepository) {}

  public execute(id: number): Promise<Comment> {
    return this.commentRepository.findById(id);
  }
}
