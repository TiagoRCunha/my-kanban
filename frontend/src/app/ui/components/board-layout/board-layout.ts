import { Component } from '@angular/core';
import { BoardColumn } from '../board-column';
import { ColumnController } from '../column-controller';

@Component({
  selector: 'app-board-layout',
  imports: [BoardColumn, ColumnController],
  templateUrl: './board-layout.html',
  styleUrl: './board-layout.scss',
})
export class BoardLayout {
  // Mocked columns
  columns = [
    {
      id: 1,
      title: 'To Do',
      position: 0,
    },
    {
      id: 2,
      title: 'In Progress',
      position: 1,
    },
    {
      id: 3,
      title: 'Done',
      position: 2,
    },
  ];

  onAddColumn(): void {
    // TODO: add new column implementation
    console.log('Add column clicked');
  }
}
