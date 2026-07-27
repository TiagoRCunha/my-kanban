import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BoardColumn } from '../board-column';
import { TaskCardData } from '../task-card';
import { ColumnController } from '../column-controller';
import { CustomTag } from '../../../domain/board/entities/task.entity';
import { TaskEditorFormValue, TaskEditorModal, TaskEditorState } from '../task-editor-modal';
import { HttpColumnRepository, HttpTaskRepository } from '../../../infrastructure/board';
import { HttpUserConfigRepository } from '../../../infrastructure/user-config/adapters/http-user-config.repository';
import { AuthService } from '../../../infrastructure/auth/auth.service';

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
export class BoardLayout implements OnChanges {
  @Input({ required: true }) boardId!: number;

  private readonly columnRepository = inject(HttpColumnRepository);
  private readonly taskRepository = inject(HttpTaskRepository);
  private readonly userConfigRepository = inject(HttpUserConfigRepository);
  private readonly authService = inject(AuthService);

  taskEditor: TaskEditorState | null = null;
  availableTags: CustomTag[] = [];

  columns: BoardColumnData[] = [];
  isLoading = true;

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['boardId'] && this.boardId) {
      await this.loadColumnsAndTasks();
    }
  }

  private async loadColumnsAndTasks(): Promise<void> {
    this.isLoading = true;

    try {
      const userId = this.authService.user?.id;
      if (userId) {
        this.availableTags = await this.userConfigRepository.getCustomTags(userId);
      }

      const domainColumns = await this.columnRepository.findByBoardId(this.boardId);

      const columnsWithTasks: BoardColumnData[] = await Promise.all(
        domainColumns.map(async (col) => {
          const tasks = await this.taskRepository.findByColumnId(col.id);

          return {
            id: col.id,
            title: col.title,
            position: col.position,
            pinned: false,
            tasks: tasks.map((task) => ({
              id: task.id,
              title: task.title,
              description: task.description,
              tagId: task.tagId,
              tagName: task.tagName,
              tagColor: task.tagColor,
              dueDate: task.dueDate,
              estimatedHours: task.estimatedHours,
              reportedById: task.reportedById,
              assigneeIds: task.assigneeIds,
            })),
          };
        }),
      );

      this.columns = columnsWithTasks;
    } catch {
      this.columns = [];
    } finally {
      this.isLoading = false;
    }
  }

  get connectedDropListIds(): string[] {
    return this.columns.map((column) => this.getDropListId(column.id));
  }

  getDropListId(columnId: number): string {
    return `column-drop-list-${columnId}`;
  }

  onTaskDrop(event: CdkDragDrop<TaskCardData[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);

      const sourceColumn = this.columns.find((col) => col.tasks === event.container.data);
      if (sourceColumn) {
        const taskOrder = event.container.data.map((task, index) => ({ id: task.id, position: index }));
        this.taskRepository.reorder(sourceColumn.id, taskOrder).catch(() => {});
      }
      return;
    }

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );

    const sourceColumn = this.findColumnByTasks(event.previousContainer.data);
    const targetColumn = this.findColumnByTasks(event.container.data);

    if (sourceColumn && targetColumn) {
      const reorderedSourceTasks = event.previousContainer.data.map((task, index) => ({ id: task.id, position: index }));
      const reorderedTargetTasks = event.container.data.map((task, index) => ({ id: task.id, position: index }));

      const movedTask = event.item.data as TaskCardData;

      this.taskRepository.moveTask(
        movedTask.id,
        sourceColumn.id,
        targetColumn.id,
        event.currentIndex,
        reorderedSourceTasks,
        reorderedTargetTasks,
      ).catch(() => {});
    }
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

    const columnOrder = this.columns.map((col, index) => ({ id: col.id, position: index }));
    this.columnRepository.reorder(this.boardId, columnOrder).catch(() => {});
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
      tagId: null,
      tagName: '',
      tagColor: '',
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
      tagId: task.tagId,
      tagName: task.tagName,
      tagColor: task.tagColor,
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
      const taskId = Math.max(0, ...this.columns.flatMap((c) => c.tasks.map((t) => t.id))) + 1;

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
              tagId: form.tagId,
              tagName: form.tagName,
              tagColor: form.tagColor,
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
            tagId: form.tagId,
            tagName: form.tagName,
            tagColor: form.tagColor,
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

  private findColumnByTasks(tasks: TaskCardData[]): BoardColumnData | undefined {
    return this.columns.find((col) => col.tasks === tasks);
  }

  async onAddColumn(title: string): Promise<void> {
    try {
      const newColumn = await this.columnRepository.create({
        title,
        position: this.columns.length,
        boardId: this.boardId,
      });

      this.columns = [
        ...this.columns,
        {
          id: newColumn.id,
          title: newColumn.title,
          position: newColumn.position,
          pinned: false,
          tasks: [],
        },
      ];
    } catch (err) {
      console.error('Failed to create column', err);
      // Silently fail if backend is not available
    }
  }
}
