import { Comment, CreateCommentInput } from '../../entities/comment.entity';
import { CommentRepository } from '../../ports/comment-repository.port';

export class CreateCommentUseCase {
  public constructor(private readonly commentRepository: CommentRepository) {}

  public execute(input: CreateCommentInput): Promise<Comment> {
    return this.commentRepository.create(input);
  }
}
