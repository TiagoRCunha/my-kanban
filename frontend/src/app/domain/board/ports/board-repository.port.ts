import { Repository } from '../../shared/default-repository';
import { Board, CreateBoardInput, UpdateBoardInput } from '../entities/board.entity';

export interface BoardRepository extends Repository<Board, CreateBoardInput, UpdateBoardInput> {
  /**
   * Removes the acting user from the board's membership. Owners cannot leave
   * their own board; both the HTTP and the local adapters enforce that rule.
   */
  leaveBoard(id: number): Promise<void>;
}
