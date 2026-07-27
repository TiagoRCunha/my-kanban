import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnimatedButton } from '../animated-button';

export type CustomTagFormValue = {
  name: string;
  color: string;
  position: number;
};

@Component({
  selector: 'app-custom-tag-row',
  imports: [FormsModule, AnimatedButton],
  templateUrl: './custom-tag-row.html',
  styleUrl: './custom-tag-row.scss',
})
export class CustomTagRow {
  @Input() name = '';
  @Input() color = '#0052CC';
  @Input() position = 0;
  @Input() disabled = false;

  @Output() save = new EventEmitter<CustomTagFormValue>();
  @Output() remove = new EventEmitter<void>();

  editedName = '';
  editedColor = '';

  ngOnInit(): void {
    this.editedName = this.name;
    this.editedColor = this.color;
  }

  ngOnChanges(): void {
    this.editedName = this.name;
    this.editedColor = this.color;
  }

  get hasChanges(): boolean {
    return this.editedName.trim() !== this.name || this.editedColor !== this.color;
  }

  get canSave(): boolean {
    return (
      this.editedName.trim().length > 0 &&
      /^#[0-9A-Fa-f]{6}$/.test(this.editedColor) &&
      this.hasChanges
    );
  }

  onSave(): void {
    if (!this.canSave) {
      return;
    }
    this.save.emit({
      name: this.editedName.trim(),
      color: this.editedColor,
      position: this.position,
    });
  }

  onCancel(): void {
    this.editedName = this.name;
    this.editedColor = this.color;
  }
}
