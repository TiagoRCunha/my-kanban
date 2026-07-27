import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-toggle-switch',
  templateUrl: './toggle-switch.html',
  styleUrl: './toggle-switch.scss',
})
export class ToggleSwitch {
  @Input() checked = false;
  @Input() disabled = false;
  @Input() label = '';

  @Output() toggled = new EventEmitter<boolean>();

  onToggle(): void {
    if (this.disabled) {
      return;
    }
    this.toggled.emit(!this.checked);
  }
}
