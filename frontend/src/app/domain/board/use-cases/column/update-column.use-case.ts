import { Column, UpdateColumnInput } from '../../entities/column.entity';
import { ColumnRepository } from '../../ports/column-repository.port';

export class UpdateColumnUseCase {
  public constructor(private readonly columnRepository: ColumnRepository) {}

  public execute(id: number, input: UpdateColumnInput): Promise<Column> {
    return this.columnRepository.update(id, input);
  }
}
