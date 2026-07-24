import { Column, ColumnCommand } from '../../../domain/board/entities/column.entity';
import { BoardColumnRequestDto, BoardColumnResponseDto } from '../dto/column.dto';

export class ColumnMapper {
  public static toDomain(dto: BoardColumnResponseDto): Column {
    return Column.fromSnapshot({
      id: dto.id,
      title: dto.title,
      position: dto.position,
      createdAt: dto.createdAt,
      updatedAt: dto.createdAt,
    });
  }

  public static toRequestDto(command: ColumnCommand): BoardColumnRequestDto {
    return {
      title: command.title,
      position: command.position,
    };
  }
}
