export class Email {
  private constructor(public readonly value: string) {}

  public static create(raw: string): Email {
    const value = raw.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!value) {
      throw new Error('Email is required.');
    }

    if (value.length > 100) {
      throw new Error('Email must have at most 100 characters.');
    }

    if (!emailPattern.test(value)) {
      throw new Error('Email must be valid.');
    }

    return new Email(value);
  }
}
