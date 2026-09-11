export type BoardColumnResponseDto = {
  id: number;
  title: string;
  position: number;
  archived: boolean;
  isDone: boolean;
  boardId: number;
  createdAt: string;
};

export type BoardColumnRequestDto = {
  title: string;
  position: number;
  archived: boolean;
  isDone: boolean;
};
