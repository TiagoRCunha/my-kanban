import { Board, UpdateBoardInput } from '../../entities/board.entity';
import { BoardRepository } from '../../ports/board-repository.port';

export class UpdateBoardUseCase {
  public constructor(private readonly boardRepository: BoardRepository) {}

  public execute(id: number, input: UpdateBoardInput): Promise<Board> {
    return this.boardRepository.update(id, input);
  }
}
