import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskPriority } from '../../../domain/board/entities/task.entity';

export type TaskEditorMode = 'create' | 'edit';

export type TaskEditorState = {
  mode: TaskEditorMode;
  columnId: number;
  taskId: number | null;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  estimatedHours: number | null;
  assigneeIdsText: string;
};

export type TaskEditorFormValue = {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  estimatedHours: number;
  assigneeIdsText: string;
};

@Component({
  selector: 'app-task-editor-modal',
  imports: [FormsModule],
  templateUrl: './task-editor-modal.html',
  styleUrl: './task-editor-modal.scss',
})
export class TaskEditorModal implements OnChanges {
  @Input() state: TaskEditorState | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<TaskEditorFormValue>();
  @Output() deleteTask = new EventEmitter<void>();

  readonly priorityOptions = Object.values(TaskPriority);

  draft: TaskEditorFormValue = {
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    dueDate: '',
    estimatedHours: null as unknown as number,
    assigneeIdsText: '',
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['state']) {
      return;
    }

    if (!this.state) {
      return;
    }

    this.draft = {
      title: this.state.title,
      description: this.state.description,
      priority: this.state.priority,
      dueDate: this.state.dueDate,
      estimatedHours: this.state.estimatedHours ?? (null as unknown as number),
      assigneeIdsText: this.state.assigneeIdsText,
    };
  }

  get isVisible(): boolean {
    return this.state !== null;
  }

  get isEditMode(): boolean {
    return this.state?.mode === 'edit';
  }

  get canSave(): boolean {
    const title = this.draft.title.trim();
    return (
      title.length > 0 &&
      this.draft.dueDate.trim().length > 0 &&
      typeof this.draft.estimatedHours === 'number' &&
      this.draft.estimatedHours > 0
    );
  }

  onClose(): void {
    this.close.emit();
  }

  onSave(): void {
    if (!this.canSave) {
      return;
    }

    this.save.emit({
      title: this.draft.title,
      description: this.draft.description,
      priority: this.draft.priority,
      dueDate: this.draft.dueDate,
      estimatedHours: this.draft.estimatedHours,
      assigneeIdsText: this.draft.assigneeIdsText,
    });
  }

  onDelete(): void {
    this.deleteTask.emit();
  }
}
