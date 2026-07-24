export type CommentResponseDto = {
  id: number;
  content: string;
  taskId: number;
  authorId: number;
  createdAt: string;
  updatedAt: string;
};

export type CommentRequestDto = {
  content: string;
};
