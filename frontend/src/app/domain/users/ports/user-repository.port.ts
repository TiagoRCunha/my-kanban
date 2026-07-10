import { Repository } from '../../shared/default-repository';
import { CreateUserInput, UpdateUserInput, User } from '../entities/user.entity';

export interface UserRepository extends Repository<User, CreateUserInput, UpdateUserInput> { }
