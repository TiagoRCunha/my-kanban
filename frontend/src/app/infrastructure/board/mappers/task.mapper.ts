import { Task, TaskCommand, TaskPriority } from '../../../domain/board/entities/task.entity';
import { TaskRequestDto, TaskResponseDto } from '../dto/task.dto';

export class TaskMapper {
  public static toDomain(dto: TaskResponseDto): Task {
    return Task.fromSnapshot({
      id: dto.id,
      title: dto.title,
      description: dto.description,
      priority: dto.priority as TaskPriority,
      dueDate: dto.dueDate,
      estimatedHours: dto.estimatedHours,
      position: dto.position,
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
      priority: command.priority,
      dueDate: command.dueDate || null,
      estimatedHours: command.estimatedHours || null,
      position: command.position,
      assigneeIds: command.assigneeIds,
    };
  }
}
