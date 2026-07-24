export type BoardColumnResponseDto = {
  id: number;
  title: string;
  position: number;
  boardId: number;
  createdAt: string;
};

export type BoardColumnRequestDto = {
  title: string;
  position: number;
};
