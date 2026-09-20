import { User } from '../../../../../domain/users/entities/user.entity'
import type { UserResponseDto } from '../../../../local/local-backend';

/**
 * Maps the local (desktop) user DTO returned by `LocalBackend` into the
 * domain `User` aggregate.
 *
 * The local backend already persists snapshot-shaped rows, so the mapping is
 * equivalent to the HTTP `UserMapper.toDomain`: `User.fromSnapshot(dto)`.
 * The mapper is kept as its own unit so `LocalUserRepository` stays a thin
 * session-role veneer with no mapping logic of its own.
 */
export class LocalSessionDrivenUserMapper {
  public static toDomain(dto: UserResponseDto): User {
    return User.fromSnapshot(dto);
  }

  public static toDomainMany(dtos: UserResponseDto[]): User[] {
    return dtos.map((dto) => LocalSessionDrivenUserMapper.toDomain(dto));
  }
}
