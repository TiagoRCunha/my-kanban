import { User } from '../entities/user.entity';
import { UserRepository } from '../ports/user-repository.port';

export class FindUserByIdUseCase {
  public constructor(private readonly userRepository: UserRepository) {}

  public execute(id: number): Promise<User> {
    return this.userRepository.findById(id);
  }
}
