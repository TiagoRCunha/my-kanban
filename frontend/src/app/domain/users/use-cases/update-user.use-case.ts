import { UpdateUserInput, User } from '../entities/user.entity';
import { UserRepository } from '../ports/user-repository.port';

export class UpdateUserUseCase {
  public constructor(private readonly userRepository: UserRepository) {}

  public execute(id: number, input: UpdateUserInput): Promise<User> {
    return this.userRepository.update(id, input);
  }
}
