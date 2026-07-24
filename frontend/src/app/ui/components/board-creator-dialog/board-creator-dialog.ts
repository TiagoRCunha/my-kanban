import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnimatedButton } from '../animated-button';

export type BoardCreatorFormValue = {
  title: string;
  description: string;
};

@Component({
  selector: 'app-board-creator-dialog',
  imports: [FormsModule, AnimatedButton],
  templateUrl: './board-creator-dialog.html',
  styleUrl: './board-creator-dialog.scss',
})
export class BoardCreatorDialog {
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<BoardCreatorFormValue>();

  isVisible = false;

  draft = {
    title: '',
    description: '',
  };

  get canSave(): boolean {
    return this.draft.title.trim().length > 0;
  }

  open(): void {
    this.draft = { title: '', description: '' };
    this.isVisible = true;
  }

  onClose(): void {
    this.isVisible = false;
    this.close.emit();
  }

  onSave(): void {
    if (!this.canSave) {
      return;
    }

    this.save.emit({
      title: this.draft.title.trim(),
      description: this.draft.description.trim(),
    });

    this.isVisible = false;
  }
}
