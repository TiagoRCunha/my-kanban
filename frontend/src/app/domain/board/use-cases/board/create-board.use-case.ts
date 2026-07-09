import { Board, CreateBoardInput } from '../../entities/board.entity';
import { BoardRepository } from '../../ports/board-repository.port';

export class CreateBoardUseCase {
  public constructor(private readonly boardRepository: BoardRepository) {}

  public execute(input: CreateBoardInput): Promise<Board> {
    return this.boardRepository.create(input);
  }
}
