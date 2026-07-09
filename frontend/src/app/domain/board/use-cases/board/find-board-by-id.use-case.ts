import { Board } from '../../entities/board.entity';
import { BoardRepository } from '../../ports/board-repository.port';

export class FindBoardByIdUseCase {
  public constructor(private readonly boardRepository: BoardRepository) {}

  public execute(id: number): Promise<Board> {
    return this.boardRepository.findById(id);
  }
}
