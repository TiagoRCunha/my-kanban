import { Column } from '../../../../domain/board/entities/column.entity';
import type { BoardColumnResponseDto } from '../../../board/dto/column.dto';

/**
 * Maps the local (desktop) column DTO returned by `LocalBackend` into the
 * domain `Column` aggregate. The local backend persists snapshot-shaped
 * rows, mirroring the HTTP `ColumnMapper.toDomain`: the response DTO only
 * carries `createdAt`, so that value doubles as `updatedAt`.
 */
export class LocalColumnMapper {
  public static toDomain(dto: BoardColumnResponseDto): Column {
    return Column.fromSnapshot({
      id: dto.id,
      title: dto.title,
      position: dto.position,
      archived: dto.archived,
      isDone: dto.isDone,
      createdAt: dto.createdAt,
      updatedAt: dto.createdAt,
    });
  }

  public static toDomainMany(dtos: BoardColumnResponseDto[]): Column[] {
    return dtos.map((dto) => LocalColumnMapper.toDomain(dto));
  }
}