import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnimatedButton } from '../animated-button';

export type StartupColumnFormValue = {
  title: string;
  position: number;
};

@Component({
  selector: 'app-startup-column-row',
  imports: [FormsModule, AnimatedButton],
  templateUrl: './startup-column-row.html',
  styleUrl: './startup-column-row.scss',
})
export class StartupColumnRow {
  @Input() title = '';
  @Input() position = 0;
  @Input() isFirst = false;
  @Input() isLast = false;
  @Input() disabled = false;

  @Output() update = new EventEmitter<StartupColumnFormValue>();
  @Output() remove = new EventEmitter<void>();
  @Output() moveUp = new EventEmitter<void>();
  @Output() moveDown = new EventEmitter<void>();

  editedTitle = '';

  ngOnInit(): void {
    this.editedTitle = this.title;
  }

  ngOnChanges(): void {
    this.editedTitle = this.title;
  }

  get canSave(): boolean {
    return this.editedTitle.trim().length > 0 && this.editedTitle.trim() !== this.title;
  }

  onSave(): void {
    if (!this.canSave) {
      return;
    }
    this.update.emit({ title: this.editedTitle.trim(), position: this.position });
  }

  onCancel(): void {
    this.editedTitle = this.title;
  }
}
