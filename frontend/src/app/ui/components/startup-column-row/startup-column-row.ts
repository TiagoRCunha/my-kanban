import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnimatedButton } from '../animated-button';

export type StartupColumnFormValue = {
  title: string;
  position: number;
  type: string;
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
  @Input() type = 'NORMAL';
  @Input() isFirst = false;
  @Input() isLast = false;
  @Input() disabled = false;
  @Input() showTypeSelector = false;
  @Input() readonlyTitle = false;
  @Input() isNew = false;

  @Output() update = new EventEmitter<StartupColumnFormValue>();
  @Output() remove = new EventEmitter<void>();
  @Output() moveUp = new EventEmitter<void>();
  @Output() moveDown = new EventEmitter<void>();

  editedTitle = '';
  editedType = 'NORMAL';

  ngOnInit(): void {
    this.editedTitle = this.title;
    this.editedType = this.type;
  }

  ngOnChanges(): void {
    this.editedTitle = this.title;
    this.editedType = this.type;
  }

  get canSave(): boolean {
    if (this.readonlyTitle) {
      return this.editedType !== this.type;
    }
    if (this.isNew) {
      return this.editedTitle.trim().length > 0;
    }
    const titleChanged = this.editedTitle.trim().length > 0 && this.editedTitle.trim() !== this.title;
    const typeChanged = this.editedType !== this.type;
    return titleChanged || typeChanged;
  }

  get hasChanges(): boolean {
    if (this.isNew) {
      return this.editedTitle.trim().length > 0 || this.editedType !== this.type;
    }
    if (this.readonlyTitle) {
      return this.editedType !== this.type;
    }
    return this.editedTitle.trim() !== this.title || this.editedType !== this.type;
  }

  onSave(): void {
    if (!this.canSave) {
      return;
    }
    this.update.emit({
      title: this.editedTitle.trim(),
      position: this.position,
      type: this.editedType,
    });
  }

  onCancel(): void {
    if (this.isNew) {
      this.remove.emit();
      return;
    }
    this.editedTitle = this.title;
    this.editedType = this.type;
  }
}
