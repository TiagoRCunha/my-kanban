import { Comment } from '../../entities/comment.entity';
import { CommentRepository } from '../../ports/comment-repository.port';

export class ListCommentsUseCase {
  public constructor(private readonly commentRepository: CommentRepository) {}

  public execute(): Promise<Comment[]> {
    return this.commentRepository.findAll();
  }
}
