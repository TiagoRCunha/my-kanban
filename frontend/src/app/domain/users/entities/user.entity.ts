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

  private static ensureId(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('User id must be a positive integer.');
    }
  }

  private static ensureFullName(fullName: string): string {
    const value = fullName.trim();

    if (!value) {
      throw new Error('Full name is required.');
    }

    if (value.length > 100) {
      throw new Error('Full name must have at most 100 characters.');
    }

    return value;
  }

  private static ensurePasswordHash(passwordHash: string): string {
    const value = passwordHash.trim();

    if (!value) {
      throw new Error('Password hash is required.');
    }

    if (value.length > 255) {
      throw new Error('Password hash must have at most 255 characters.');
    }

    return value;
  }

  private static ensureAvatarUrl(avatarUrl: string | null): string | null {
    if (avatarUrl == null) {
      return null;
    }

    const value = avatarUrl.trim();

    if (!value) {
      return null;
    }

    if (value.length > 255) {
      throw new Error('Avatar URL must have at most 255 characters.');
    }

    return value;
  }

  private static ensureDate(raw: string, fieldName: string): Date {
    const date = new Date(raw);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`${fieldName} must be a valid ISO date string.`);
    }

    return date;
  }
}
