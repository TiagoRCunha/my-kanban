import type { LocalActorPort } from '../../../../../domain/shared/ports/local-actor.port';
import type { LocalBackend } from '../../../../local/local-backend';
import { User, type CreateUserInput, type UpdateUserInput } from '../../../../../domain/users/entities/user.entity';
import { UserRepository } from '../../../../../domain/users/ports/user-repository.port';
import { LocalSessionDrivenUserMapper } from './local-user.mapper';

/**
 * Local (desktop) adapter for the user repository, backed by `LocalBackend`.
 * Every call resolves the acting user id from the given `LocalActorPort`,
 * mirroring how the JWT carries identity for the HTTP adapters.
 */
export class LocalUserRepository implements UserRepository {
  constructor(
    private readonly backend: LocalBackend,
    private readonly actor: LocalActorPort,
  ) {}

  public async findAll(): Promise<User[]> {
    const actorId = await this.actor.resolveActorId();
    return LocalSessionDrivenUserMapper.toDomainMany(await this.backend.listUsers(actorId));
  }

  public async findById(id: number): Promise<User> {
    const actorId = await this.actor.resolveActorId();
    return LocalSessionDrivenUserMapper.toDomain(await this.backend.findUserById(actorId, id));
  }

  public async create(input: CreateUserInput): Promise<User> {
    const actorId = await this.actor.resolveActorId();
    return LocalSessionDrivenUserMapper.toDomain(await this.backend.createUser(actorId, input));
  }

  public async update(id: number, input: UpdateUserInput): Promise<User> {
    const actorId = await this.actor.resolveActorId();
    return LocalSessionDrivenUserMapper.toDomain(await this.backend.updateUser(actorId, id, input));
  }

  public async delete(id: number): Promise<void> {
    const actorId = await this.actor.resolveActorId();
    await this.backend.deleteUser(actorId, id);
  }
}
