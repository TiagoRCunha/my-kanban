import { DomainValidators } from "../../shared/domain-validators";

export type CommentSnapshot = {
  id: number;
  content: string;
  taskId: number;
  authorId: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateCommentInput = {
  content: string;
  taskId: number;
  authorId: number;
};

export type UpdateCommentInput = {
  content: string;
  taskId: number;
  authorId: number;
};

export type CommentCommand = {
  content: string;
  taskId: number | void;
  authorId: number | void;
};

export class Comment {
  private constructor(
    public readonly id: number,
    public readonly content: string,
    public readonly taskId: number | void,
    public readonly authorId: number | void,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) { }

  public static fromSnapshot(snapshot: CommentSnapshot): Comment {
    Comment.ensureId(snapshot.id);
    const content = Comment.ensureContent(snapshot.content);

    return new Comment(
      snapshot.id,
      content,
      snapshot.taskId,
      snapshot.authorId,
      Comment.ensureDate(snapshot.createdAt, 'createdAt'),
      Comment.ensureDate(snapshot.updatedAt, 'updatedAt'),
    );
  }

  public static toCommand(input: CreateCommentInput | UpdateCommentInput): CommentCommand {
    return {
      content: Comment.ensureContent(input.content),
      taskId: Comment.ensureId(input.taskId),
      authorId: Comment.ensureId(input.authorId),
    };
  }

  private static ensureId(id: number): number | void {
    return DomainValidators.positiveInteger(id, 'Comment id');
  }

  private static ensureContent(content: string): string {
    return DomainValidators.requiredString(content, 'Content', 100);
  }

  private static ensureDate(raw: string, fieldName: string): Date {
    return DomainValidators.isoDate(raw, fieldName);
  }
}
