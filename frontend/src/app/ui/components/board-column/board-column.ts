import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TaskCard } from '../task-card';
import { TaskCardData } from '../task-card';

export type ColumnData = {
  id: number;
  title: string;
  position: number;
};

@Component({
  selector: 'app-board-column',
  imports: [TaskCard, DragDropModule],
  templateUrl: './board-column.html',
  styleUrl: './board-column.scss',
})
export class BoardColumn {
  @Input() column!: ColumnData;
  @Input() tasks: TaskCardData[] = [];
  @Input() dropListId = '';
  @Input() connectedDropListIds: string[] = [];
  @Output() taskDropped = new EventEmitter<CdkDragDrop<TaskCardData[]>>();

  onDrop(event: CdkDragDrop<TaskCardData[]>): void {
    this.taskDropped.emit(event);
  }

  onAddTask(): void {
    // TODO: add new task implementation
    console.log('Add task clicked');
  }
}
