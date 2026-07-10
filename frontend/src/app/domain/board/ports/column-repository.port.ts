import { Repository } from '../../shared/default-repository';
import { Column, CreateColumnInput, UpdateColumnInput } from '../entities/column.entity';

export interface ColumnRepository extends Repository<Column, CreateColumnInput, UpdateColumnInput> { }
