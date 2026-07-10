import { Board } from '../../entities/board.entity';
import { BoardRepository } from '../../ports/board-repository.port';

export class ListBoardsUseCase {
  public constructor(private readonly boardRepository: BoardRepository) {}

  public execute(): Promise<Board[]> {
    return this.boardRepository.findAll();
  }
}
