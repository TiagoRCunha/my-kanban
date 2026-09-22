import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../../domain/users';
import { ListUsersUseCase } from '../../../domain/users';
import { USER_REPOSITORY } from '../../../infrastructure/di/repository-tokens';

@Component({
  selector: 'app-user-picker',
  imports: [FormsModule],
  templateUrl: './user-picker.html',
  styleUrl: './user-picker.scss',
})
export class UserPicker implements OnChanges {
  @Input() selectedIds: number[] = [];
  @Output() selectedIdsChange = new EventEmitter<number[]>();

  private readonly userRepository = inject(USER_REPOSITORY);
  private readonly listUsersUseCase = new ListUsersUseCase(this.userRepository);

  users: User[] = [];
  searchText = '';
  isOpen = false;
  isLoading = false;
  errorMessage = '';

  async ngOnChanges(): Promise<void> {
    if (this.users.length === 0 && !this.isLoading) {
      await this.loadUsers();
    }
  }

  get selectedUsers(): User[] {
    return this.users.filter((user) => this.selectedIds.includes(user.id));
  }

  get filteredUsers(): User[] {
    const query = this.searchText.trim().toLowerCase();
    if (!query) {
      return this.users;
    }

    return this.users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(query) ||
        user.email.value.toLowerCase().includes(query),
    );
  }

  async loadUsers(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.users = await this.listUsersUseCase.execute();
    } catch {
      this.errorMessage = 'Failed to load users.';
    } finally {
      this.isLoading = false;
    }
  }

  isSelected(userId: number): boolean {
    return this.selectedIds.includes(userId);
  }

  toggleUser(user: User): void {
    const isSelected = this.isSelected(user.id);
    const next = isSelected
      ? this.selectedIds.filter((id) => id !== user.id)
      : [...this.selectedIds, user.id];
    this.selectedIdsChange.emit(next);
  }

  removeUser(userId: number): void {
    this.selectedIdsChange.emit(this.selectedIds.filter((id) => id !== userId));
  }

  getInitials(fullName: string): string {
    return fullName.charAt(0).toUpperCase();
  }
}