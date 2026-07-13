import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { TaskPriority } from '../../../domain/board/entities/task.entity';

export type TaskCardData = {
  id: number;
  title: string;
  priority: TaskPriority;
  assigneeIds: number[];
};

@Component({
  selector: 'app-task-card',
  imports: [NgClass],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
})
export class TaskCard {
  @Input() task!: TaskCardData;
  @Output() deleteTask = new EventEmitter<number>();

  getPriorityClass(): string {
    return `task-card--priority-${this.task.priority.toLowerCase()}`;
  }

  onDeleteTask(): void {
    this.deleteTask.emit(this.task.id);
  }
}
