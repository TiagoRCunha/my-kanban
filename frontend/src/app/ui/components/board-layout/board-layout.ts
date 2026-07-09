import { Component } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BoardColumn } from '../board-column';
import { TaskCardData } from '../task-card';
import { ColumnController } from '../column-controller';
import { TaskPriority } from '../../../domain/board/entities/task.entity';

type BoardColumnData = {
  id: number;
  title: string;
  position: number;
  tasks: TaskCardData[];
};

@Component({
  selector: 'app-board-layout',
  imports: [BoardColumn, ColumnController, DragDropModule],
  templateUrl: './board-layout.html',
  styleUrl: './board-layout.scss',
})
export class BoardLayout {
  columns: BoardColumnData[] = [
    {
      id: 1,
      title: 'To Do',
      position: 0,
      tasks: [
        {
          id: 1,
          title: 'Design the navbar layout',
          priority: TaskPriority.HIGH,
          assigneeIds: [1, 2],
        },
      ],
    },
    {
      id: 2,
      title: 'In Progress',
      position: 1,
      tasks: [
        {
          id: 2,
          title: 'Implement drag and drop',
          priority: TaskPriority.MEDIUM,
          assigneeIds: [1],
        },
      ],
    },
    {
      id: 3,
      title: 'Done',
      position: 2,
      tasks: [
        {
          id: 3,
          title: 'Scaffold board page layout',
          priority: TaskPriority.LOW,
          assigneeIds: [],
        },
      ],
    },
  ];

  get connectedDropListIds(): string[] {
    return this.columns.map((column) => this.getDropListId(column.id));
  }

  getDropListId(columnId: number): string {
    return `column-drop-list-${columnId}`;
  }

  onTaskDrop(event: CdkDragDrop<TaskCardData[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );
  }

  onColumnDrop(event: CdkDragDrop<BoardColumnData[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    moveItemInArray(this.columns, event.previousIndex, event.currentIndex);

    this.columns.forEach((column, index) => {
      column.position = index;
    });
  }

  onAddColumn(): void {
    // TODO: add new column implementation
    console.log('Add column clicked');
  }
}
