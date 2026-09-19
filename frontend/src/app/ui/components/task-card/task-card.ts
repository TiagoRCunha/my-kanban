import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BoardPermissions, getBoardPermissions } from '../../../domain/board/entities/board-permissions';

export type TaskCardData = {
  id: number;
  title: string;
  description: string;
  tagId: number | null;
  tagName: string;
  tagColor: string;
  dueDate: string;
  estimatedHours: number;
  position: number;
  done: boolean;
  reportedById: number;
  assigneeIds: number[];
};

@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
})
export class TaskCard {
  @Input() task!: TaskCardData;
  @Input() currentUserId: number | null = null;
  @Input() hasDoneColumn = false;
  @Input() hasArchiveColumn = false;
  @Input() isArchived = false;
  @Input() permissions: BoardPermissions | null = null;
  @Output() openTask = new EventEmitter<number>();
  @Output() deleteTask = new EventEmitter<number>();
  @Output() doneTask = new EventEmitter<number>();
  @Output() archiveTask = new EventEmitter<number>();

  get effectivePermissions(): BoardPermissions {
    return this.permissions ?? getBoardPermissions(null, false);
  }

  get isOverdue(): boolean {
    if (this.task.done || !this.task.dueDate) {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(this.task.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }

  get isOwner(): boolean {
    return this.currentUserId !== null && this.task.reportedById === this.currentUserId;
  }

  get canInteract(): boolean {
    return this.effectivePermissions.canEditTask;
  }

  get showDoneButton(): boolean {
    return !this.task.done
      && this.canInteract
      && this.isOwner
      && this.hasDoneColumn
      && !this.isArchived;
  }

  get showArchiveButton(): boolean {
    return !this.isArchived
      && !this.task.done
      && this.hasArchiveColumn
      && this.isOwner
      && this.canInteract;
  }

  getDueDateLabel(dueDate: string): string {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    if(due < today) {
      if (due.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
        return 'Yesterday';
      } else {
        // "Overdue by ... days" label
        const diffTime = Math.abs(today.getTime() - due.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `Overdue by ${diffDays} day${diffDays > 1 ? 's' : ''}`;
      }
    } else {
      return ""
    }
  }

  onOpenTask(): void {
    if (!this.canInteract) {
      return;
    }
    this.openTask.emit(this.task.id);
  }

  onDeleteTask(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.canInteract) {
      return;
    }
    this.deleteTask.emit(this.task.id);
  }

  onDoneTask(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.canInteract) {
      return;
    }
    this.doneTask.emit(this.task.id);
  }

  onArchiveTask(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.canInteract) {
      return;
    }
    this.archiveTask.emit(this.task.id);
  }
}
