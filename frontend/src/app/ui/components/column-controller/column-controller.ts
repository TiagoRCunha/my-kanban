import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-column-controller',
  imports: [],
  templateUrl: './column-controller.html',
  styleUrl: './column-controller.scss',
})
export class ColumnController {
  @Output() onAdd = new EventEmitter<void>();

  addColumn(): void {
    this.onAdd.emit();
  }
}
