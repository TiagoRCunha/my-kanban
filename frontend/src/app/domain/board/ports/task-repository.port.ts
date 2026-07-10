import { Repository } from '../../shared/default-repository';
import { CreateTaskInput, UpdateTaskInput, Task } from '../entities/task.entity';

export interface TaskRepository extends Repository<Task, CreateTaskInput, UpdateTaskInput> { }
