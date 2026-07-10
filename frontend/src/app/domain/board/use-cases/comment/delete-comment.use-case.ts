import { CommentRepository } from '../../ports/comment-repository.port';

export class DeleteCommentUseCase {
  public constructor(private readonly commentRepository: CommentRepository) {}

  public execute(id: number): Promise<void> {
    return this.commentRepository.delete(id);
  }
}
