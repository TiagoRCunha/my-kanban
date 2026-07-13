import { Component } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BoardColumn } from '../board-column';
import { TaskCardData } from '../task-card';
import { ColumnController } from '../column-controller';
import { TaskPriority } from '../../../domain/board/entities/task.entity';
import { TaskEditorFormValue, TaskEditorModal, TaskEditorState } from '../task-editor-modal';

type BoardColumnData = {
  id: number;
  title: string;
  position: number;
  pinned: boolean;
  tasks: TaskCardData[];
};

@Component({
  selector: 'app-board-layout',
  imports: [BoardColumn, ColumnController, DragDropModule, TaskEditorModal],
  templateUrl: './board-layout.html',
  styleUrl: './board-layout.scss',
})
export class BoardLayout {
  taskEditor: TaskEditorState | null = null;

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
          description: 'Prepare the first static navbar for board navigation.',
          priority: TaskPriority.HIGH,
          dueDate: '2026-07-20',
          estimatedHours: 4,
          reportedById: 1,
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
          description: 'Enable drag and drop across columns.',
          priority: TaskPriority.MEDIUM,
          dueDate: '2026-07-22',
          estimatedHours: 6,
          reportedById: 1,
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
          description: 'Create board wrapper and mocked first column.',
          priority: TaskPriority.LOW,
          dueDate: '2026-07-25',
          estimatedHours: 3,
          reportedById: 1,
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
    this.taskEditor = {
      mode: 'create',
      columnId,
      taskId: null,
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      dueDate: '',
      estimatedHours: null,
      assigneeIdsText: '',
    };
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

    if (this.taskEditor?.columnId === columnId && this.taskEditor.taskId === taskId) {
      this.onCloseTaskModal();
    }
  }

  onOpenTask(columnId: number, taskId: number): void {
    const column = this.columns.find((value) => value.id === columnId);
    const task = column?.tasks.find((value) => value.id === taskId);

    if (!column || !task) {
      return;
    }

    this.taskEditor = {
      mode: 'edit',
      columnId,
      taskId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      assigneeIdsText: task.assigneeIds.join(', '),
    };
  }

  onCloseTaskModal(): void {
    this.taskEditor = null;
  }

  onSaveTaskChanges(form: TaskEditorFormValue): void {
    if (!this.taskEditor) {
      return;
    }

    const title = form.title.trim();
    if (!title) {
      return;
    }

    const assigneeIds = form.assigneeIdsText
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value !== '')
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);

    if (this.taskEditor.mode === 'create') {
      const taskId = this.getNextTaskId();
      this.columns = this.columns.map((column) => {
        if (column.id !== this.taskEditor?.columnId) {
          return column;
        }

        return {
          ...column,
          tasks: [
            ...column.tasks,
            {
              id: taskId,
              title,
              description: form.description.trim(),
              priority: form.priority,
              dueDate: form.dueDate,
              estimatedHours: form.estimatedHours,
              reportedById: 1,
              assigneeIds,
            },
          ],
        };
      });

      this.onCloseTaskModal();
      return;
    }

    this.columns = this.columns.map((column) => {
      if (column.id !== this.taskEditor?.columnId) {
        return column;
      }

      return {
        ...column,
        tasks: column.tasks.map((task) => {
          if (task.id !== this.taskEditor?.taskId) {
            return task;
          }

          return {
            ...task,
            title,
            description: form.description.trim(),
            priority: form.priority,
            dueDate: form.dueDate,
            estimatedHours: form.estimatedHours,
            assigneeIds,
          };
        }),
      };
    });

    this.onCloseTaskModal();
  }

  onDeleteTaskFromModal(): void {
    if (!this.taskEditor || this.taskEditor.mode !== 'edit' || this.taskEditor.taskId === null) {
      return;
    }

    this.onDeleteTask(this.taskEditor.columnId, this.taskEditor.taskId);
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
