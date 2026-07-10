import { User } from '../entities/user.entity';
import { UserRepository } from '../ports/user-repository.port';

export class ListUsersUseCase {
  public constructor(private readonly userRepository: UserRepository) {}

  public execute(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
