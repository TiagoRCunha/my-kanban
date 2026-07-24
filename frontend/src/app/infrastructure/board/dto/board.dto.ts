export type BoardResponseDto = {
  id: number;
  title: string;
  description: string | null;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
};

export type BoardRequestDto = {
  title: string;
  description?: string | null;
};
