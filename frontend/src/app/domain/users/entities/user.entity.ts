import { DomainValidators } from '../../shared/domain-validators';
import { Email } from '../value-objects/email.value-object';

export type UserSnapshot = {
  id: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserInput = {
  fullName: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string | null;
};

export type UpdateUserInput = {
  fullName: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string | null;
};

export type UserCommand = {
  fullName: string;
  email: string;
  passwordHash: string;
  avatarUrl: string | null;
};

export class User {
  private constructor(
    public readonly id: number,
    public readonly fullName: string,
    public readonly email: Email,
    public readonly avatarUrl: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  public static fromSnapshot(snapshot: UserSnapshot): User {
    User.ensureId(snapshot.id);
    const fullName = User.ensureFullName(snapshot.fullName);
    const avatarUrl = User.ensureAvatarUrl(snapshot.avatarUrl ?? null);

    return new User(
      snapshot.id,
      fullName,
      Email.create(snapshot.email),
      avatarUrl,
      User.ensureDate(snapshot.createdAt, 'createdAt'),
      User.ensureDate(snapshot.updatedAt, 'updatedAt'),
    );
  }

  public static toCommand(input: CreateUserInput | UpdateUserInput): UserCommand {
    return {
      fullName: User.ensureFullName(input.fullName),
      email: Email.create(input.email).value,
      passwordHash: User.ensurePasswordHash(input.passwordHash),
      avatarUrl: User.ensureAvatarUrl(input.avatarUrl ?? null),
    };
  }

  private static ensureId(id: number): number {
    return DomainValidators.positiveInteger(id, 'User id');
  }

  private static ensureFullName(fullName: string): string {
    return DomainValidators.requiredString(fullName, 'Full name', 100);
  }

  private static ensurePasswordHash(passwordHash: string): string {
    return DomainValidators.requiredString(passwordHash, 'Password hash', 255);
    // TODO: Add password hash format validation
  }

  private static ensureAvatarUrl(avatarUrl: string | null): string | null {
    return DomainValidators.optionalString(avatarUrl, 255);
  }

  private static ensureDate(raw: string, fieldName: string): Date {
    return DomainValidators.isoDate(raw, fieldName);
  }
}
