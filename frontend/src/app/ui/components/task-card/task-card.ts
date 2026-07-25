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
  @Output() openTask = new EventEmitter<number>();
  @Output() deleteTask = new EventEmitter<number>();

  onOpenTask(): void {
    this.openTask.emit(this.task.id);
  }

  onDeleteTask(event: MouseEvent): void {
    event.stopPropagation();
    this.deleteTask.emit(this.task.id);
  }
}
