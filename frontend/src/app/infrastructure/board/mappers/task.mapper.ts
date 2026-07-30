import { Task, TaskCommand } from '../../../domain/board/entities/task.entity';
import { TaskRequestDto, TaskResponseDto } from '../dto/task.dto';

export class TaskMapper {
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

  public static toRequestDto(command: TaskCommand): TaskRequestDto {
    return {
      title: command.title,
      description: command.description,
      tagId: command.tagId,
      dueDate: command.dueDate || null,
      estimatedHours: command.estimatedHours || null,
      position: command.position,
      assigneeIds: command.assigneeIds,
    };
  }
}
