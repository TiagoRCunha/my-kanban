import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskCard } from '../task-card';
import { TaskCardData } from '../task-card';

export type ColumnData = {
  id: number;
  title: string;
  position: number;
  pinned: boolean;
};

@Component({
  selector: 'app-board-column',
  imports: [TaskCard, DragDropModule, FormsModule],
  templateUrl: './board-column.html',
  styleUrl: './board-column.scss',
})
export class BoardColumn {
  @Input() column!: ColumnData;
  @Input() isPinned = false;
  @Input() tasks: TaskCardData[] = [];
  @Input() dropListId = '';
  @Input() connectedDropListIds: string[] = [];
  @Output() taskDropped = new EventEmitter<CdkDragDrop<TaskCardData[]>>();
  @Output() createTask = new EventEmitter<number>();
  @Output() openTask = new EventEmitter<number>();
  @Output() deleteTask = new EventEmitter<number>();
  @Output() togglePin = new EventEmitter<void>();
  @Output() renameColumn = new EventEmitter<string>();
  isRenaming = false;
  renameTitle = '';

  onDrop(event: CdkDragDrop<TaskCardData[]>): void {
    this.taskDropped.emit(event);
  }

  onAddTask(): void {
    this.createTask.emit(this.column.id);
  }

  onDeleteTask(taskId: number): void {
    this.deleteTask.emit(taskId);
  }

  onOpenTask(taskId: number): void {
    this.openTask.emit(taskId);
  }

  onTogglePin(): void {
    this.togglePin.emit();
  }

  onToggleRename(): void {
    this.renameTitle = this.column.title;
    this.isRenaming = !this.isRenaming;
  }

  onCancelRename(): void {
    this.isRenaming = false;
    this.renameTitle = this.column.title;
  }

  onRenameColumn(): void {
    const title = this.renameTitle.trim();

    if (!title) {
      this.onCancelRename();
      return;
    }

    this.renameColumn.emit(title);
    this.isRenaming = false;
  }
}
