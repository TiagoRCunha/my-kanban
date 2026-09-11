import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';

export type AnimatedButtonVariant = 'confirm' | 'danger' | 'neutral';
export type AnimatedButtonIcon = 'plus' | 'close' | 'check';

@Component({
  selector: 'app-animated-button',
  imports: [NgClass],
  templateUrl: './animated-button.html',
  styleUrl: './animated-button.scss',
})
export class AnimatedButton {
  @Input() label = '';
  @Input() variant: AnimatedButtonVariant = 'confirm';

  /** Icon override. Defaults: confirm → check, danger/neutral → close. */
  @Input() set icon(value: AnimatedButtonIcon | undefined) {
    this._icon = value;
  }
  _icon?: AnimatedButtonIcon;

  @Input() disabled = false;
  @Input() compact = false;
  @Input() title?: string;
  @Input() ariaLabel?: string;

  @Output() pressed = new EventEmitter<void>();

  private readonly ICON_PATHS: Record<AnimatedButtonIcon, string> = {
    plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
    close: 'M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z',
    check: 'M20.285 6.709a1 1 0 0 1 .006 1.414l-9.192 9.273a1 1 0 0 1-1.42 0L3.71 11.44a1 1 0 1 1 1.414-1.415l5.265 5.264 8.484-8.573a1 1 0 0 1 1.412-.007z',
  };

  private get defaultIcon(): AnimatedButtonIcon {
    return this.variant === 'confirm' ? 'check' : 'close';
  }

  get resolvedIcon(): AnimatedButtonIcon {
    return this._icon ?? this.defaultIcon;
  }

  get iconPath(): string {
    return this.ICON_PATHS[this.resolvedIcon];
  }

  get iconSize(): number {
    return this.resolvedIcon === 'check' ? 16 : 14;
  }

  onPress(): void {
    if (this.disabled) {
      return;
    }

    this.pressed.emit();
  }
}