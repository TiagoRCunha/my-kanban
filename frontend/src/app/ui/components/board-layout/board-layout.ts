import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BoardColumn, ColumnData } from '../board-column';
import { TaskCardData } from '../task-card';
import { ColumnController } from '../column-controller';
import { CustomTag } from '../../../domain/board/entities/task.entity';
import { TaskEditorFormValue, TaskEditorModal, TaskEditorState } from '../task-editor-modal';
import { HttpColumnRepository, HttpTaskRepository } from '../../../infrastructure/board';
import { HttpUserConfigAdapter } from '../../../infrastructure/user-config';
import { AuthService } from '../../../infrastructure/auth/auth.service';

type BoardColumnData = {
  id: number;
  title: string;
  position: number;
  pinned: boolean;
  archived: boolean;
  isDone: boolean;
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
  @Input() boardOwnerId: number | null = null;

  private readonly columnRepository = inject(HttpColumnRepository);
  private readonly taskRepository = inject(HttpTaskRepository);
  private readonly userConfigAdapter = inject(HttpUserConfigAdapter);
  private readonly authService = inject(AuthService);

  taskEditor: TaskEditorState | null = null;
  availableTags: CustomTag[] = [];

  columns: BoardColumnData[] = [];
  taskLimit = 10;
  private loadMoreCounts: Record<number, number> = {};
  isLoading = true;
  hasDoneColumn = false;
  hasArchiveColumn = false;

  getVisibleTasks(column: BoardColumnData): TaskCardData[] {
    const multiplier = this.loadMoreCounts[column.id] ?? 1;
    return column.tasks.slice(0, this.taskLimit * multiplier);
  }

  hasMoreTasks(column: BoardColumnData): boolean {
    const multiplier = this.loadMoreCounts[column.id] ?? 1;
    return column.tasks.length > this.taskLimit * multiplier;
  }

  onLoadMoreTasks(columnId: number): void {
    this.loadMoreCounts[columnId] = (this.loadMoreCounts[columnId] ?? 1) + 1;
  }

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
        const config = await this.userConfigAdapter.getConfig(userId);
        this.availableTags = config.customTags.map((ct) => ({ id: ct.id, name: ct.name, color: ct.color, position: ct.position }));
        this.taskLimit = config.defaultTaskLimit;
      }

      this.loadMoreCounts = {};

      const domainColumns = await this.columnRepository.findByBoardId(this.boardId);

      const columnsWithTasks: BoardColumnData[] = await Promise.all(
        domainColumns.map(async (col) => {
          const tasks = await this.taskRepository.findByColumnId(col.id);

          return {
            id: col.id,
            title: col.title,
            position: col.position,
            pinned: false,
            archived: col.archived,
            isDone: col.isDone,
            tasks: tasks.map((task) => ({
              id: task.id,
              title: task.title,
              description: task.description,
              tagId: task.tagId,
              tagName: task.tagName,
              tagColor: task.tagColor,
              dueDate: task.dueDate,
              estimatedHours: task.estimatedHours,
              position: task.position,
              done: task.done,
              reportedById: task.reportedById,
              assigneeIds: task.assigneeIds,
            })),
          };
        }),
      );

      this.columns = columnsWithTasks;
      this.hasDoneColumn = columnsWithTasks.some((col) => col.isDone);
      this.hasArchiveColumn = columnsWithTasks.some((col) => col.archived);
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
    const sourceColumn =
      this.findColumnByContainerId(event.previousContainer?.id)
      ?? this.findColumnByTasks(event.previousContainer.data);

    if (event.previousContainer === event.container) {
      if (!sourceColumn) {
        return;
      }

      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);

      // The drop list only exposes the visible slice, so write the new order back
      // into the underlying full task array to keep pagination and the UI consistent.
      const visibleCount = event.container.data.length;
      sourceColumn.tasks = [...event.container.data, ...sourceColumn.tasks.slice(visibleCount)];

      const taskOrder = sourceColumn.tasks.map((task, index) => ({ id: task.id, position: index }));
      this.taskRepository.reorder(sourceColumn.id, taskOrder).catch(() => {});
      return;
    }

    const targetColumn =
      (this.findColumnByContainerId(event.container?.id) ?? this.findColumnByTasks(event.container.data))
      || undefined;

    if (!sourceColumn || !targetColumn) {
      return;
    }

    // Snapshot the visible slices BEFORE mutating them. The drop lists expose a paged
    // slice of the full task arrays, so the tasks that were not visible (paged out) must
    // be re-appended afterwards. Recomputing the full arrays by index after the transfer
    // would keep the moved task in the source column (and could drop a hidden target task).
    const sourceVisibleIds = new Set(event.previousContainer.data.map((task) => task.id));
    const targetVisibleIds = new Set(event.container.data.map((task) => task.id));

    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

    sourceColumn.tasks = [
      ...event.previousContainer.data,
      ...sourceColumn.tasks.filter((task) => !sourceVisibleIds.has(task.id)),
    ];
    targetColumn.tasks = [
      ...event.container.data,
      ...targetColumn.tasks.filter((task) => !targetVisibleIds.has(task.id)),
    ];

    const reorderedSourceTasks = sourceColumn.tasks.map((task, index) => ({ id: task.id, position: index }));
    const reorderedTargetTasks = targetColumn.tasks.map((task, index) => ({ id: task.id, position: index }));

    const movedTask = event.item.data as TaskCardData;
    movedTask.done = targetColumn.isDone;

    this.taskRepository.moveTask(
      movedTask.id,
      sourceColumn.id,
      targetColumn.id,
      event.currentIndex,
      reorderedSourceTasks,
      reorderedTargetTasks,
    ).catch(() => {});
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

  async onRenameColumn(columnId: number, newTitle: string): Promise<void> {
    const title = newTitle.trim();

    if (!title) {
      return;
    }

    try {
      const column = this.columns.find((c) => c.id === columnId);
      if (column) {
        await this.columnRepository.update(columnId, {
          title,
          position: column.position,
          archived: column.archived,
          isDone: column.isDone,
          boardId: this.boardId,
        });
      }
    } catch (err) {
      console.error('Failed to rename column', err);
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

  async onDeleteColumn(columnId: number): Promise<void> {
    try {
      const column = this.columns.find((c) => c.id === columnId);
      if (!column) {
        return;
      }

      await this.columnRepository.delete(columnId, this.boardId);

      this.columns = this.columns.filter((c) => c.id !== columnId);
      this.hasDoneColumn = this.columns.some((col) => col.isDone);
      this.hasArchiveColumn = this.columns.some((col) => col.archived);
    } catch (err) {
      console.error('Failed to delete column', err);
    }
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
      canDelete: false,
    };
  }

  async onDeleteTask(columnId: number, taskId: number): Promise<void> {
    try {
      await this.taskRepository.delete(taskId, columnId);
    } catch (err) {
      console.error('Failed to delete task', err);
      return;
    }

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
      canDelete: this.canDeleteTask(task.reportedById),
    };
  }

  onCloseTaskModal(): void {
    this.taskEditor = null;
  }

  async onSaveTaskChanges(form: TaskEditorFormValue): Promise<void> {
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
      try {
        const position = this.taskEditor.columnId
          ? (this.columns.find((c) => c.id === this.taskEditor!.columnId)?.tasks.length ?? 0)
          : 0;

        const createdTask = await this.taskRepository.create({
          title,
          description: form.description.trim() || null,
          tagId: form.tagId,
          dueDate: form.dueDate || null,
          estimatedHours: form.estimatedHours || null,
          position,
          reportedById: this.authService.user?.id ?? 0,
          columnId: this.taskEditor.columnId,
          assigneeIds,
        });

        this.columns = this.columns.map((column) => {
          if (column.id !== this.taskEditor?.columnId) {
            return column;
          }

          return {
            ...column,
            tasks: [
              ...column.tasks,
              {
                id: createdTask.id,
                title: createdTask.title,
                description: createdTask.description,
                tagId: createdTask.tagId,
                tagName: createdTask.tagName,
                tagColor: createdTask.tagColor,
                dueDate: createdTask.dueDate,
                estimatedHours: createdTask.estimatedHours,
                position: createdTask.position,
                reportedById: createdTask.reportedById,
                assigneeIds: createdTask.assigneeIds,
                done: createdTask.done,
              },
            ],
          };
        });

        this.onCloseTaskModal();
      } catch (err) {
        console.error('Failed to create task', err);
      }
      return;
    }

    try {
      const column = this.columns.find((c) => c.id === this.taskEditor!.columnId);
      const task = column?.tasks.find((t) => t.id === this.taskEditor!.taskId);
      if (!column || !task) {
        return;
      }

        const position = column.tasks.findIndex((t) => t.id === this.taskEditor!.taskId);

        const updatedTask = await this.taskRepository.update(this.taskEditor.taskId!, {
          title,
          description: form.description.trim() || null,
          tagId: form.tagId,
          dueDate: form.dueDate || null,
          estimatedHours: form.estimatedHours || null,
          position,
          reportedById: task.reportedById,
          assigneeIds,
          columnId: this.taskEditor.columnId,
        });

      this.columns = this.columns.map((column) => {
        if (column.id !== this.taskEditor?.columnId) {
          return column;
        }

        return {
          ...column,
          tasks: column.tasks.map((t) => {
            if (t.id !== this.taskEditor?.taskId) {
              return t;
            }

            return {
              id: updatedTask.id,
              title: updatedTask.title,
              description: updatedTask.description,
              tagId: updatedTask.tagId,
              tagName: updatedTask.tagName,
              tagColor: updatedTask.tagColor,
              dueDate: updatedTask.dueDate,
              estimatedHours: updatedTask.estimatedHours,
              position: updatedTask.position,
              reportedById: updatedTask.reportedById,
              assigneeIds: updatedTask.assigneeIds,
              done: updatedTask.done,
            };
          }),
        };
      });

      this.onCloseTaskModal();
    } catch (err) {
      console.error('Failed to update task', err);
    }
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

  private findColumnByContainerId(containerId: string | undefined): BoardColumnData | undefined {
    const prefix = 'column-drop-list-';
    if (!containerId || !containerId.startsWith(prefix)) {
      return undefined;
    }

    const columnId = Number(containerId.slice(prefix.length));
    return this.columns.find((col) => col.id === columnId);
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
          archived: newColumn.archived,
          isDone: newColumn.isDone,
          tasks: [],
        },
      ];
      this.hasDoneColumn = this.columns.some((col) => col.isDone);
    } catch (err) {
      console.error('Failed to create column', err);
      // Silently fail if backend is not available
    }
  }

  async onDoneTask(columnId: number, taskId: number): Promise<void> {
    try {
      const updatedTask = await this.taskRepository.markAsDone(taskId, columnId);

      this.columns = this.columns.map((column) => {
        if (column.id !== columnId) {
          return column;
        }

        return {
          ...column,
          tasks: column.tasks.filter((t) => t.id !== taskId),
        };
      });

      // Add the task to the done column
      const doneColumn = this.columns.find((col) => col.isDone);
      if (doneColumn) {
        this.columns = this.columns.map((column) => {
          if (column.id !== doneColumn.id) {
            return column;
          }

          return {
            ...column,
            tasks: [
              ...column.tasks,
              {
                id: updatedTask.id,
                title: updatedTask.title,
                description: updatedTask.description,
                tagId: updatedTask.tagId,
                tagName: updatedTask.tagName,
                tagColor: updatedTask.tagColor,
                dueDate: updatedTask.dueDate,
                estimatedHours: updatedTask.estimatedHours,
                position: updatedTask.position,
                done: updatedTask.done,
                reportedById: updatedTask.reportedById,
                assigneeIds: updatedTask.assigneeIds,
              },
            ],
          };
        });
      }
    } catch (err) {
      console.error('Failed to mark task as done', err);
    }
  }

  async onArchiveTask(columnId: number, taskId: number): Promise<void> {
    try {
      const archiveColumn = this.columns.find((col) => col.archived && !col.isDone);
      if (!archiveColumn) {
        console.error('No archive column found');
        return;
      }

      const task = this.columns
        .find((col) => col.id === columnId)
        ?.tasks.find((t) => t.id === taskId);
      if (!task) return;

      const targetTasks = archiveColumn.tasks;
      const reorderedTargetTasks = targetTasks.map((t, i) => ({ id: t.id, position: i }));
      reorderedTargetTasks.push({ id: taskId, position: targetTasks.length });

      await this.taskRepository.moveTask(
        taskId,
        columnId,
        archiveColumn.id,
        targetTasks.length,
        null,
        reorderedTargetTasks,
      );

      // Move task locally
      this.columns = this.columns.map((column) => {
        if (column.id === columnId) {
          return { ...column, tasks: column.tasks.filter((t) => t.id !== taskId) };
        }
        if (column.id === archiveColumn.id) {
          task.done = false;
          return { ...column, tasks: [...column.tasks, { ...task }] };
        }
        return column;
      });
    } catch (err) {
      console.error('Failed to archive task', err);
    }
  }

  getCurrentUserId(): number | null {
    return this.authService.user?.id ?? null;
  }

  isBoardOwner(): boolean {
    const userId = this.authService.user?.id;
    return userId != null && this.boardOwnerId === userId;
  }

  canDeleteTask(reportedById: number): boolean {
    return this.isBoardOwner() || this.authService.user?.id === reportedById;
  }
}
