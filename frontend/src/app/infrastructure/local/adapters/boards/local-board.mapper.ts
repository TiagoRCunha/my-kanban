import { Board } from '../../../../domain/board/entities/board.entity';
import type { BoardResponseDto } from '../../../board/dto/board.dto';

/**
 * Maps the local (desktop) board DTO returned by `LocalBackend` into the
 * domain `Board` aggregate. The local backend already persists
 * snapshot-shaped rows, so this mirrors the HTTP `BoardMapper.toDomain`.
 */
export class LocalBoardMapper {
  public static toDomain(dto: BoardResponseDto): Board {
    return Board.fromSnapshot(dto);
  }

  public static toDomainMany(dtos: BoardResponseDto[]): Board[] {
    return dtos.map((dto) => LocalBoardMapper.toDomain(dto));
  }
}