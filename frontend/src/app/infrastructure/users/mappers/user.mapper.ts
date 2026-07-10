import { User, UserCommand } from '../../../domain/users';
import { UserRequestDto } from '../dto/user-request.dto';
import { UserResponseDto } from '../dto/user-response.dto';

export class UserMapper {
  public static toDomain(dto: UserResponseDto): User {
    return User.fromSnapshot(dto);
  }

  public static toRequestDto(command: UserCommand): UserRequestDto {
    return {
      fullName: command.fullName,
      email: command.email,
      passwordHash: command.passwordHash,
      avatarUrl: command.avatarUrl,
    };
  }
}
