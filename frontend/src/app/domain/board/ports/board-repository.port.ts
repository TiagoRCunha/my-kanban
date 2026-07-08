import { Repository } from '../../shared/default-repository';
import { Board, CreateBoardInput, UpdateBoardInput } from '../entities/board.entity';

export interface BoardRepository extends Repository<Board, CreateBoardInput, UpdateBoardInput> { }
