import { TaskRepository } from '../../ports/task-repository.port';
import { DeleteTaskUseCase } from './delete-task.use-case';

describe('DeleteTaskUseCase', () => {
  it('delegates delete to the repository and resolves void', async () => {
    const repository = jasmine.createSpyObj<TaskRepository>('TaskRepository', ['delete']);
    repository.delete.and.resolveTo();

    const useCase = new DeleteTaskUseCase(repository);

    await expectAsync(useCase.execute(42)).toBeResolvedTo(undefined);
    expect(repository.delete).toHaveBeenCalledOnceWith(42);
  });
});