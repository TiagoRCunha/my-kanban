import { Column } from '../../entities/column.entity';
import { ColumnRepository } from '../../ports/column-repository.port';

export class ListColumnsUseCase {
  public constructor(private readonly columnRepository: ColumnRepository) {}

  public execute(): Promise<Column[]> {
    return this.columnRepository.findAll();
  }
}
