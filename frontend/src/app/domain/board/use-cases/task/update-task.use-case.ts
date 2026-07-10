import { Task, UpdateTaskInput } from '../../entities/task.entity';
import { TaskRepository } from '../../ports/task-repository.port';

export class UpdateTaskUseCase {
  public constructor(private readonly taskRepository: TaskRepository) {}

  public execute(id: number, input: UpdateTaskInput): Promise<Task> {
    return this.taskRepository.update(id, input);
  }
}
