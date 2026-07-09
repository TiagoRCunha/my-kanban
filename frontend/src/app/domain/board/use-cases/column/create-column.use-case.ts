import { Column, CreateColumnInput } from '../../entities/column.entity';
import { ColumnRepository } from '../../ports/column-repository.port';

export class CreateColumnUseCase {
  public constructor(private readonly columnRepository: ColumnRepository) {}

  public execute(input: CreateColumnInput): Promise<Column> {
    return this.columnRepository.create(input);
  }
}
