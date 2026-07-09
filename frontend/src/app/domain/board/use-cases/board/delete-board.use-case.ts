import { BoardRepository } from '../../ports/board-repository.port';

export class DeleteBoardUseCase {
  public constructor(private readonly boardRepository: BoardRepository) {}

  public execute(id: number): Promise<void> {
    return this.boardRepository.delete(id);
  }
}
