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
  pinned: boolean;
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
      pinned: false,
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
      pinned: false,
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
      pinned: false,
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

  private getNextTaskId(): number {
    const currentMaxTaskId = this.columns.reduce((maxTaskId, column) => {
      const maxInColumn = column.tasks.reduce((maxId, task) => Math.max(maxId, task.id), 0);
      return Math.max(maxTaskId, maxInColumn);
    }, 0);

    return currentMaxTaskId + 1;
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

    const pinnedIndexById = new Map<number, number>();
    this.columns.forEach((column, index) => {
      if (column.pinned) {
        pinnedIndexById.set(column.id, index);
      }
    });

    const reorderedColumns = [...this.columns];
    moveItemInArray(reorderedColumns, event.previousIndex, event.currentIndex);

    const pinnedMoved = reorderedColumns.some((column, index) => {
      if (!column.pinned) {
        return false;
      }
      return pinnedIndexById.get(column.id) !== index;
    });

    if (pinnedMoved) {
      return;
    }

    this.columns = reorderedColumns;

    this.columns.forEach((column, index) => {
      column.position = index;
    });
  }

  onToggleColumnPin(columnId: number): void {
    this.columns = this.columns.map((column) => {
      if (column.id !== columnId) {
        return column;
      }

      return {
        ...column,
        pinned: !column.pinned,
      };
    });
  }

  onRenameColumn(columnId: number, newTitle: string): void {
    const title = newTitle.trim();

    if (!title) {
      return;
    }

    this.columns = this.columns.map((column) => {
      if (column.id !== columnId) {
        return column;
      }

      return {
        ...column,
        title,
      };
    });
  }

  onCreateTask(columnId: number): void {
    const taskId = this.getNextTaskId();

    this.columns = this.columns.map((column) => {
      if (column.id !== columnId) {
        return column;
      }

      return {
        ...column,
        tasks: [
          ...column.tasks,
          {
            id: taskId,
            title: `New Task ${taskId}`,
            priority: TaskPriority.MEDIUM,
            assigneeIds: [],
          },
        ],
      };
    });
  }

  onDeleteTask(columnId: number, taskId: number): void {
    this.columns = this.columns.map((column) => {
      if (column.id !== columnId) {
        return column;
      }

      return {
        ...column,
        tasks: column.tasks.filter((task) => task.id !== taskId),
      };
    });
  }

  onAddColumn(): void {
    const nextId = this.columns.reduce((maxId, column) => Math.max(maxId, column.id), 0) + 1;

    this.columns = [
      ...this.columns,
      {
        id: nextId,
        title: `New Column ${nextId}`,
        position: this.columns.length,
        pinned: false,
        tasks: [],
      },
    ];
  }
}
