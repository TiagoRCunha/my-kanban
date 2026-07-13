import { CreateTaskInput, Task, TaskPriority } from '../../entities/task.entity';
import { TaskRepository } from '../../ports/task-repository.port';
import { CreateTaskUseCase } from './create-task.use-case';

describe('CreateTaskUseCase', () => {
  it('delegates create to the repository and returns the created task', async () => {
    const repository = jasmine.createSpyObj<TaskRepository>('TaskRepository', ['create']);
    const input: CreateTaskInput = {
      title: 'Implement task creation',
      description: 'Create the new task flow',
      priority: TaskPriority.HIGH,
      dueDate: '2026-08-15',
      estimatedHours: 4,
      position: 1,
      reportedById: 1,
      columnId: 2,
      assigneeIds: [3],
    };

    const createdTask = {
      id: 10,
      title: 'Implement task creation',
      description: 'Create the new task flow',
      priority: TaskPriority.HIGH,
      dueDate: '2026-08-15',
      estimatedHours: 4,
      position: 1,
      reportedById: 1,
      assigneeIds: [3],
      createdAt: new Date('2026-07-11T10:00:00.000Z'),
      updatedAt: new Date('2026-07-11T10:00:00.000Z'),
    } as Task;

    repository.create.and.resolveTo(createdTask);

    const useCase = new CreateTaskUseCase(repository);

    await expectAsync(useCase.execute(input)).toBeResolvedTo(createdTask);
    expect(repository.create).toHaveBeenCalledOnceWith(input);
  });
});