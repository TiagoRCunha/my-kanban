export class DomainValidators {
  static positiveInteger(value: number, fieldName: string): number {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${fieldName} must be a positive integer.`);
    }
    return value;
  }

  static requiredString(value: string, fieldName: string, maxLength: number = 100): string {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error(`${fieldName} is required.`);
    }
    if (trimmed.length > maxLength) {
      throw new Error(`${fieldName} must have at most ${maxLength} characters.`);
    }
    return trimmed;
  }

  static optionalString(value: string | null | undefined, maxLength: number = 255): string | null {
    if (value == null) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.length > maxLength) {
      throw new Error(`String must have at most ${maxLength} characters.`);
    }
    return trimmed;
  }

  static isoDate(raw: string, fieldName: string): Date {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`${fieldName} must be a valid ISO date string.`);
    }
    return date;
  }

  static positiveIntegerArray(values: number[], fieldName: string): number[] {
    if (!Array.isArray(values)) {
      throw new Error(`${fieldName} must be an array.`);
    }
    return values.map((id) => this.positiveInteger(id, `${fieldName}[]`));
  }
}