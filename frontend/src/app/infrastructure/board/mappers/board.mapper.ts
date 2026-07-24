import { Board, BoardCommand } from '../../../domain/board/entities/board.entity';
import { BoardRequestDto, BoardResponseDto } from '../dto/board.dto';

export class BoardMapper {
  public static toDomain(dto: BoardResponseDto): Board {
    return Board.fromSnapshot({
      id: dto.id,
      title: dto.title,
      description: dto.description,
      ownerId: dto.ownerId,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public static toRequestDto(command: BoardCommand): BoardRequestDto {
    return {
      title: command.title,
      description: command.description,
    };
  }
}
