import { Task } from '../../../../domain/board/entities/task.entity';
import type { TaskResponseDto } from '../../../board/dto/task.dto';

/**
 * Maps the local (desktop) task DTO returned by `LocalBackend` into the
 * domain `Task` aggregate. The local backend persists snapshot-shaped rows,
 * mirroring the HTTP `TaskMapper.toDomain` field by field.
 */
export class LocalTaskMapper {
  public static toDomain(dto: TaskResponseDto): Task {
    return Task.fromSnapshot({
      id: dto.id,
      title: dto.title,
      description: dto.description,
      tagId: dto.tagId,
      tagName: dto.tagName,
      tagColor: dto.tagColor,
      dueDate: dto.dueDate,
      estimatedHours: dto.estimatedHours,
      position: dto.position,
      done: dto.done,
      columnId: dto.columnId,
      reportedById: dto.reportedById,
      assigneeIds: dto.assigneeIds,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public static toDomainMany(dtos: TaskResponseDto[]): Task[] {
    return dtos.map((dto) => LocalTaskMapper.toDomain(dto));
  }
}