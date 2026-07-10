import { DomainValidators } from "../../shared/domain-validators";

export type BoardSnapshot = {
  id: number;
  title: string;
  description: string | null;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateBoardInput = {
  title: string;
  description?: string | null;
  ownerId: number;
};

export type UpdateBoardInput = {
  title: string;
  description?: string | null;
  ownerId: number;
};

export type BoardCommand = {
  title: string;
  description: string | null;
  ownerId: number;
};

export class Board {
  private constructor(
    public readonly id: number,
    public readonly title: string,
    public readonly description: string | null,
    public readonly ownerId: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) { }

  public static fromSnapshot(snapshot: BoardSnapshot): Board {
    Board.ensureId(snapshot.id);
    const title = Board.ensureTitle(snapshot.title);
    const description = Board.ensureDescription(snapshot.description ?? null);

    return new Board(
      snapshot.id,
      title,
      description,
      snapshot.ownerId,
      Board.ensureDate(snapshot.createdAt, 'createdAt'),
      Board.ensureDate(snapshot.updatedAt, 'updatedAt'),
    );
  }

  public static toCommand(input: CreateBoardInput | UpdateBoardInput): BoardCommand {
    return {
      title: Board.ensureTitle(input.title),
      description: Board.ensureDescription(input.description ?? null),
      ownerId: Board.ensureId(input.ownerId),
    };
  }

  private static ensureId(id: number): number {
    return DomainValidators.positiveInteger(id, 'Board id');
  }

  private static ensureTitle(title: string): string {
    return DomainValidators.requiredString(title, 'Title', 100);
  }

  private static ensureDescription(description: string | null): string | null {
    return DomainValidators.optionalString(description, 255);
  }

  private static ensureDate(raw: string, fieldName: string): Date {
    return DomainValidators.isoDate(raw, fieldName);
  }
}
