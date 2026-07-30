import { Component, EventEmitter, Input, Output } from '@angular/core';

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
  @Output() openTask = new EventEmitter<number>();
  @Output() deleteTask = new EventEmitter<number>();
  @Output() doneTask = new EventEmitter<number>();
  @Output() archiveTask = new EventEmitter<number>();

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

  get showDoneButton(): boolean {
    return !this.task.done && this.isOwner && this.hasDoneColumn && !this.isArchived;
  }

  get showArchiveButton(): boolean {
    return !this.isArchived && !this.task.done && this.hasArchiveColumn && this.isOwner;
  }

  onOpenTask(): void {
    this.openTask.emit(this.task.id);
  }

  onDeleteTask(event: MouseEvent): void {
    event.stopPropagation();
    this.deleteTask.emit(this.task.id);
  }

  onDoneTask(event: MouseEvent): void {
    event.stopPropagation();
    this.doneTask.emit(this.task.id);
  }

  onArchiveTask(event: MouseEvent): void {
    event.stopPropagation();
    this.archiveTask.emit(this.task.id);
  }
}
