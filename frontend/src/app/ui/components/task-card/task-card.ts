import { Component, Input } from '@angular/core';
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

  getPriorityClass(): string {
    return `task-card--priority-${this.task.priority.toLowerCase()}`;
  }
}
