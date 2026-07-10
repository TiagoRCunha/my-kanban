import { UserRepository } from '../ports/user-repository.port';

export class DeleteUserUseCase {
  public constructor(private readonly userRepository: UserRepository) {}

  public execute(id: number): Promise<void> {
    return this.userRepository.delete(id);
  }
}
