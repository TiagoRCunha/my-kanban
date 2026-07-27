import { Component, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-column-controller',
  imports: [FormsModule],
  templateUrl: './column-controller.html',
  styleUrl: './column-controller.scss',
})
export class ColumnController implements AfterViewInit {
  @Output() onAdd = new EventEmitter<string>();

  @ViewChild('columnTitleInput') inputRef!: ElementRef<HTMLInputElement>;

  isEditing = false;
  title = '';

  ngAfterViewInit(): void {
    if (this.isEditing && this.inputRef) {
      this.inputRef.nativeElement.focus();
    }
  }

  startEditing(): void {
    this.isEditing = true;
    this.title = '';
  }

  confirmColumn(): void {
    const trimmed = this.title.trim();
    if (trimmed) {
      this.onAdd.emit(trimmed);
    }
    
    this.cancelEditing();
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.title = '';
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.confirmColumn();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEditing();
    }
  }
}
