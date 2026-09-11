export type TaskResponseDto = {
  id: number;
  title: string;
  description: string | null;
  tagId: number | null;
  tagName: string | null;
  tagColor: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  position: number;
  done: boolean;
  columnId: number;
  reportedById: number;
  assigneeIds: number[];
  createdAt: string;
  updatedAt: string;
};

export type TaskRequestDto = {
  title: string;
  description?: string | null;
  tagId: number | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
  position: number;
  assigneeIds: number[];
};
