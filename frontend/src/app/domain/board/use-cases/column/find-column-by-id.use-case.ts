import { Column } from '../../entities/column.entity';
import { ColumnRepository } from '../../ports/column-repository.port';

export class FindColumnByIdUseCase {
  public constructor(private readonly columnRepository: ColumnRepository) {}

  public execute(id: number): Promise<Column> {
    return this.columnRepository.findById(id);
  }
}
