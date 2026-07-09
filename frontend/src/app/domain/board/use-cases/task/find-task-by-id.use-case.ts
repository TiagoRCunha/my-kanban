import { Task } from '../../entities/task.entity';
import { TaskRepository } from '../../ports/task-repository.port';

export class FindTaskByIdUseCase {
  public constructor(private readonly taskRepository: TaskRepository) {}

  public execute(id: number): Promise<Task> {
    return this.taskRepository.findById(id);
  }
}
