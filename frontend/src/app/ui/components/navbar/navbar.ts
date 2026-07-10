import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  onToggleDarkMode(): void {
    // TODO: dark mode implementation
  }

  onLogout(): void {
    // TODO: logout implementation
  }
}
