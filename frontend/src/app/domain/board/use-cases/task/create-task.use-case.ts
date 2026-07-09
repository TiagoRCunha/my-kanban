import { Task, CreateTaskInput } from '../../entities/task.entity';
import { TaskRepository } from '../../ports/task-repository.port';

export class CreateTaskUseCase {
  public constructor(private readonly taskRepository: TaskRepository) {}

  public execute(input: CreateTaskInput): Promise<Task> {
    return this.taskRepository.create(input);
  }
}
