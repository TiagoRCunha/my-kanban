import { TaskRepository } from '../../ports/task-repository.port';

export class DeleteTaskUseCase {
  public constructor(private readonly taskRepository: TaskRepository) {}

  public execute(id: number): Promise<void> {
    return this.taskRepository.delete(id);
  }
}
