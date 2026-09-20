import type { UserResponseDto } from '../../../users/dto/user-response.dto';
import { User } from '../../../../domain/users/entities/user.entity';
import { LocalSessionDrivenUserMapper } from './local-user.mapper';

describe('LocalSessionDrivenUserMapper', () => {
  const dto: UserResponseDto = {
    id: 1,
    fullName: 'Alice',
    email: 'alice@example.com',
    avatarUrl: null,
    role: 'USER',
    createdAt: '2026-09-20T10:00:00.000Z',
    updatedAt: '2026-09-20T10:00:00.000Z',
  };

  it('maps a local user DTO into the domain User', () => {
    const user = LocalSessionDrivenUserMapper.toDomain(dto);

    expect(user).toBeInstanceOf(User);
    expect(user.id).toBe(1);
    expect(user.fullName).toBe('Alice');
    expect(user.email.value).toBe('alice@example.com');
    expect(user.role).toBe('USER');
  });

  it('maps a list of DTOs into a list of domain Users', () => {
    const users = LocalSessionDrivenUserMapper.toDomainMany([dto, dto]);

    expect(users.length).toBe(2);
    expect(users[1].email.value).toBe('alice@example.com');
  });
});