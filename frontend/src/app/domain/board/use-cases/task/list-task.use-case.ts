import { Task } from '../../entities/task.entity';
import { TaskRepository } from '../../ports/task-repository.port';

export class ListTasksUseCase {
  public constructor(private readonly taskRepository: TaskRepository) {}

  public execute(): Promise<Task[]> {
    return this.taskRepository.findAll();
  }
}
