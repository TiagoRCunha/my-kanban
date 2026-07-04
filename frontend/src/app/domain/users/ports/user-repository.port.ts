import { CreateUserInput, UpdateUserInput, User } from '../entities/user.entity';

export interface UserRepository {
  findAll(): Promise<User[]>;
  findById(id: number): Promise<User>;
  create(input: CreateUserInput): Promise<User>;
  update(id: number, input: UpdateUserInput): Promise<User>;
  delete(id: number): Promise<void>;
}
