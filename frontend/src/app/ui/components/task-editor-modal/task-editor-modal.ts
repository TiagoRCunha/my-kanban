import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnimatedButton } from '../animated-button';
import { UserPicker } from '../user-picker';
import { CustomTag } from '../../../domain/board/entities/task.entity';

export type TaskEditorMode = 'create' | 'edit';

export type TaskEditorState = {
  mode: TaskEditorMode;
  columnId: number;
  taskId: number | null;
  title: string;
  description: string;
  tagId: number | null;
  tagName: string;
  tagColor: string;
  dueDate: string;
  estimatedHours: number | null;
  assigneeIds: number[];
  canDelete: boolean;
};

export type TaskEditorFormValue = {
  title: string;
  description: string;
  tagId: number | null;
  tagName: string;
  tagColor: string;
  dueDate: string;
  estimatedHours: number;
  assigneeIds: number[];
};

@Component({
  selector: 'app-task-editor-modal',
  imports: [FormsModule, AnimatedButton, UserPicker],
  templateUrl: './task-editor-modal.html',
  styleUrl: './task-editor-modal.scss',
})
export class TaskEditorModal implements OnChanges {
  @Input() state: TaskEditorState | null = null;
  @Input() availableTags: CustomTag[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<TaskEditorFormValue>();
  @Output() deleteTask = new EventEmitter<void>();

  draft: TaskEditorFormValue = {
    title: '',
    description: '',
    tagId: null,
    tagName: '',
    tagColor: '',
    dueDate: '',
    estimatedHours: null as unknown as number,
    assigneeIds: [],
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
      tagId: this.state.tagId,
      tagName: this.state.tagName,
      tagColor: this.state.tagColor,
      dueDate: this.state.dueDate,
      estimatedHours: this.state.estimatedHours ?? (null as unknown as number),
      assigneeIds: [...this.state.assigneeIds],
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

  selectTag(tag: CustomTag): void {
    this.draft.tagId = tag.id;
    this.draft.tagName = tag.name;
    this.draft.tagColor = tag.color;
  }

  clearTag(): void {
    this.draft.tagId = null;
    this.draft.tagName = '';
    this.draft.tagColor = '';
  }

  isTagSelected(tag: CustomTag): boolean {
    return this.draft.tagId === tag.id;
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
      tagId: this.draft.tagId,
      tagName: this.draft.tagName,
      tagColor: this.draft.tagColor,
      dueDate: this.draft.dueDate,
      estimatedHours: this.draft.estimatedHours,
      assigneeIds: [...this.draft.assigneeIds],
    });
  }

  onDelete(): void {
    this.deleteTask.emit();
  }
}
