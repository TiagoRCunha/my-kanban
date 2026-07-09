import { ColumnRepository } from '../../ports/column-repository.port';

export class DeleteColumnUseCase {
  public constructor(private readonly columnRepository: ColumnRepository) {}

  public execute(id: number): Promise<void> {
    return this.columnRepository.delete(id);
  }
}
