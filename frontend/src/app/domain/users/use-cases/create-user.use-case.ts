import { CreateUserInput, User } from '../entities/user.entity';
import { UserRepository } from '../ports/user-repository.port';

export class CreateUserUseCase {
  public constructor(private readonly userRepository: UserRepository) {}

  public execute(input: CreateUserInput): Promise<User> {
    return this.userRepository.create(input);
  }
}
