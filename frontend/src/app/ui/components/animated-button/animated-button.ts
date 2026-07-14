import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';

export type AnimatedButtonVariant = 'confirm' | 'danger' | 'neutral';

@Component({
  selector: 'app-animated-button',
  imports: [NgClass],
  templateUrl: './animated-button.html',
  styleUrl: './animated-button.scss',
})
export class AnimatedButton {
  @Input() label = '';
  @Input() variant: AnimatedButtonVariant = 'confirm';
  @Input() disabled = false;
  @Input() title?: string;
  @Input() ariaLabel?: string;

  @Output() pressed = new EventEmitter<void>();

  get iconPath(): string {
    if (this.variant === 'danger' || this.variant === 'neutral') {
      return 'M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z';
    }

    return 'M20.285 6.709a1 1 0 0 1 .006 1.414l-9.192 9.273a1 1 0 0 1-1.42 0L3.71 11.44a1 1 0 1 1 1.414-1.415l5.265 5.264 8.484-8.573a1 1 0 0 1 1.412-.007z';
  }

  get iconSize(): number {
    return this.variant === 'confirm' ? 16 : 14;
  }

  onPress(): void {
    if (this.disabled) {
      return;
    }

    this.pressed.emit();
  }
}