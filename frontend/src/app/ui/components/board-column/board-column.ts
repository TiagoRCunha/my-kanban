import { Component, Input } from '@angular/core';
import { TaskCard } from '../task-card';
import { TaskPriority } from '../../../domain/board/entities/task.entity';

export type ColumnData = {
  id: number;
  title: string;
  position: number;
};

export type TaskCardData = {
  id: number;
  title: string;
  priority: TaskPriority;
  assigneeIds: number[];
};

@Component({
  selector: 'app-board-column',
  imports: [TaskCard],
  templateUrl: './board-column.html',
  styleUrl: './board-column.scss',
})
export class BoardColumn {
  @Input() column!: ColumnData;

  // Mocked tasks for the column
  tasks: TaskCardData[] = [
    {
      id: 1,
      title: 'Design the navbar layout',
      priority: TaskPriority.HIGH,
      assigneeIds: [1, 2],
    },
    {
      id: 2,
      title: 'Implement drag and drop',
      priority: TaskPriority.MEDIUM,
      assigneeIds: [1],
    },
  ];

  onAddTask(): void {
    // TODO: add new task implementation
    console.log('Add task clicked');
  }
}
