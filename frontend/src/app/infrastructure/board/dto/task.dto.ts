export type TaskResponseDto = {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  dueDate: string | null;
  estimatedHours: number | null;
  position: number;
  columnId: number;
  reportedById: number;
  assigneeIds: number[];
  createdAt: string;
  updatedAt: string;
};

export type TaskRequestDto = {
  title: string;
  description?: string | null;
  priority: string;
  dueDate?: string | null;
  estimatedHours?: number | null;
  position: number;
  assigneeIds: number[];
};
