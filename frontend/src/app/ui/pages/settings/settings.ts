import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../components/navbar';
import { ToggleSwitch } from '../../components/toggle-switch';
import { StartupColumnRow } from '../../components/startup-column-row';
import { CustomTagRow, CustomTagFormValue } from '../../components/custom-tag-row';
import { AnimatedButton } from '../../components/animated-button';
import { AuthService } from '../../../infrastructure/auth';
import { ThemeService } from '../../../infrastructure/theme/theme.service';
import { HttpUserConfigAdapter } from '../../../infrastructure/user-config';
import { HttpBoardRepository } from '../../../infrastructure/board/adapters/http-board.repository';
import { HttpColumnRepository } from '../../../infrastructure/board/adapters/http-column.repository';
import { UserConfig } from '../../../domain/users/entities/user-config.entity';
import { StartupColumn } from '../../../domain/users/entities/startup-column.entity';
import { CustomTagSettings } from '../../../domain/users/entities/custom-tag-settings.entity';
import { Board } from '../../../domain/board/entities/board.entity';
import { Column } from '../../../domain/board/entities/column.entity';

type SettingsTab = 'appearance' | 'security' | 'startup-columns' | 'custom-tags' | 'columns';

@Component({
  selector: 'app-settings-page',
  imports: [Navbar, ToggleSwitch, StartupColumnRow, CustomTagRow, AnimatedButton, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly configAdapter = inject(HttpUserConfigAdapter);
  private readonly boardRepository = inject(HttpBoardRepository);
  private readonly columnRepository = inject(HttpColumnRepository);

  userConfig: UserConfig | null = null;
  isLoading = true;
  errorMessage = '';
  activeTab: SettingsTab = 'appearance';

  // Startup columns local draft
  startupColumnsDraft: StartupColumn[] = [];
  isSavingColumns = false;
  columnsSuccessMessage = '';

  // Board columns per board (for Column Types tab)
  boardList: { board: Board; columns: Column[] }[] = [];
  isSavingBoardColumn = false;

  // Custom tags local draft
  customTagsDraft: CustomTagSettings[] = [];
  isSavingTags = false;
  tagsSuccessMessage = '';

  // Change password form
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  isSavingPassword = false;
  passwordSuccessMessage = '';
  passwordErrorMessage = '';

  get userId(): number {
    return this.authService.user?.id ?? 0;
  }

  get isDarkMode(): boolean {
    return this.themeService.darkMode;
  }

  async ngOnInit(): Promise<void> {
    await this.loadConfig();
  }

  setTab(tab: SettingsTab): void {
    this.activeTab = tab;
    this.columnsSuccessMessage = '';
    this.tagsSuccessMessage = '';
  }

  // ─── Appearance ──────────────────────────────────────────────────────────

  taskLimitDraft = 10;
  isSavingTaskLimit = false;
  taskLimitSuccessMessage = '';

  async onToggleDarkMode(): Promise<void> {
    await this.themeService.toggleDarkMode(this.userId);
    this.userConfig = this.userConfig?.withDarkMode(this.themeService.darkMode) ?? null;
  }

  async onSaveTaskLimit(): Promise<void> {
    const limit = Math.max(1, Math.min(100, this.taskLimitDraft));
    this.taskLimitDraft = limit;
    this.isSavingTaskLimit = true;
    this.taskLimitSuccessMessage = '';

    try {
      await this.configAdapter.updateConfig(this.userId, { defaultTaskLimit: limit });
      this.userConfig = this.userConfig?.withDefaultTaskLimit(limit) ?? null;
      this.taskLimitSuccessMessage = 'Task limit saved successfully.';
    } catch {
      this.errorMessage = 'Failed to save task limit. Please try again.';
    } finally {
      this.isSavingTaskLimit = false;
    }
  }

  // ─── Security ────────────────────────────────────────────────────────────

  async onChangePassword(): Promise<void> {
    this.passwordErrorMessage = '';
    this.passwordSuccessMessage = '';

    if (this.newPassword !== this.confirmPassword) {
      this.passwordErrorMessage = 'New passwords do not match.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.passwordErrorMessage = 'New password must be at least 6 characters.';
      return;
    }

    this.isSavingPassword = true;

    try {
      await this.authService.changePassword(this.currentPassword, this.newPassword);
      this.passwordSuccessMessage = 'Password changed successfully.';
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    } catch (error: any) {
      if (error?.status === 403) {
        this.passwordErrorMessage = 'Current password is incorrect.';
      } else {
        this.passwordErrorMessage = 'Failed to change password. Please try again.';
      }
    } finally {
      this.isSavingPassword = false;
    }
  }

  // ─── Startup Columns ─────────────────────────────────────────────────────

  addStartupColumn(): void {
    const nextPosition = this.startupColumnsDraft.length;
    const tempId = -(Date.now());
    this.startupColumnsDraft = [
      ...this.startupColumnsDraft,
      StartupColumn.fromCreateInput({ title: '', position: nextPosition, type: 'NORMAL' }, tempId),
    ];
  }

  moveStartupColumnUp(index: number): void {
    if (index === 0) return;
    const columns = [...this.startupColumnsDraft];
    const temp = columns[index];
    columns[index] = columns[index - 1];
    columns[index - 1] = temp;
    this.startupColumnsDraft = this.reindexColumns(columns);
  }

  moveStartupColumnDown(index: number): void {
    if (index === this.startupColumnsDraft.length - 1) return;
    const columns = [...this.startupColumnsDraft];
    const temp = columns[index];
    columns[index] = columns[index + 1];
    columns[index + 1] = temp;
    this.startupColumnsDraft = this.reindexColumns(columns);
  }

  removeStartupColumn(index: number): void {
    const columns = this.startupColumnsDraft.filter((_, i) => i !== index);
    this.startupColumnsDraft = this.reindexColumns(columns);
  }

  async onUpdateStartupColumn(index: number, value: { title: string; position: number; type: string }): Promise<void> {
    const columns = [...this.startupColumnsDraft];
    columns[index] = columns[index].withTitle(value.title).withType(value.type);
    this.startupColumnsDraft = columns;

    this.isSavingColumns = true;
    try {
      const commands = this.startupColumnsDraft.map((col, i) =>
        StartupColumn.toCommand({ title: col.title, position: i, type: col.type }),
      );
      await this.configAdapter.saveStartupColumns(this.userId, commands);
      this.columnsSuccessMessage = 'Startup columns saved successfully.';
    } catch {
      this.errorMessage = 'Failed to save startup columns. Please try again.';
    } finally {
      this.isSavingColumns = false;
    }
  }

  private async saveStartupColumns(): Promise<void> {
    this.isSavingColumns = true;
    this.columnsSuccessMessage = '';

    try {
      const commands = this.startupColumnsDraft.map((col, i) =>
        StartupColumn.toCommand({ title: col.title, position: i, type: col.type }),
      );
      await this.configAdapter.saveStartupColumns(this.userId, commands);
      await this.loadConfig();
      this.columnsSuccessMessage = 'Startup columns saved successfully.';
    } catch {
      this.errorMessage = 'Failed to save startup columns. Please try again.';
    } finally {
      this.isSavingColumns = false;
    }
  }

  // ─── Custom Tags ─────────────────────────────────────────────────────────

  addCustomTag(): void {
    const nextPosition = this.nextCustomTagPosition();
    const tempId = -(Date.now());
    this.customTagsDraft = [
      ...this.customTagsDraft,
      CustomTagSettings.fromCreateInput(
        { name: '', color: '#0052CC', position: nextPosition },
        tempId,
      ),
    ];
  }

  removeCustomTag(index: number): void {
    this.customTagsDraft = this.customTagsDraft.filter((_, i) => i !== index);
  }

  async saveCustomTag(index: number, value: CustomTagFormValue): Promise<void> {
    const tag = this.customTagsDraft[index];
    if (!tag) return;

    this.isSavingTags = true;
    this.tagsSuccessMessage = '';

    try {
      if (tag.id > 0) {
        await this.configAdapter.updateCustomTag(this.userId, tag.id, value);
      } else {
        // Use the next free position instead of the row index: deleted tags can
        // leave gaps (and the backend rejects duplicate positions with 409).
        await this.configAdapter.createCustomTag(this.userId, {
          ...value,
          position: this.nextCustomTagPosition(),
        });
      }
      await this.loadConfig();
      this.tagsSuccessMessage = 'Custom tag saved successfully.';
    } catch {
      this.errorMessage = 'Failed to save custom tag. Please try again.';
    } finally {
      this.isSavingTags = false;
    }
  }

  async deleteCustomTag(index: number): Promise<void> {
    const tag = this.customTagsDraft[index];
    if (!tag) return;

    this.isSavingTags = true;
    this.tagsSuccessMessage = '';

    try {
      if (tag.id > 0) {
        await this.configAdapter.deleteCustomTag(this.userId, tag.id);
      }
      this.customTagsDraft = this.customTagsDraft.filter((_, i) => i !== index);
      await this.loadConfig();
      this.tagsSuccessMessage = 'Custom tag deleted successfully.';
    } catch {
      this.errorMessage = 'Failed to delete custom tag. Please try again.';
    } finally {
      this.isSavingTags = false;
    }
  }

  // ─── Board Columns (Column Types tab) ─────────────────────────────────

  async onUpdateBoardColumnType(boardId: number, columnId: number, value: { title: string; position: number; type: string }): Promise<void> {
    this.isSavingBoardColumn = true;
    try {
      const archived = value.type === 'ARCHIVE';
      const isDone = value.type === 'DONE';
      await this.columnRepository.update(columnId, {
        title: value.title,
        position: value.position,
        archived,
        isDone,
        boardId,
      });
      // Refresh the columns for this board
      const boardEntry = this.boardList.find((b) => b.board.id === boardId);
      if (boardEntry) {
        boardEntry.columns = await this.columnRepository.findByBoardId(boardId);
      }
    } catch {
      this.errorMessage = 'Failed to update column type. Please try again.';
    } finally {
      this.isSavingBoardColumn = false;
    }
  }

  columnType(column: Column): string {
    if (column.isDone) { return 'DONE'; }
    if (column.archived) { return 'ARCHIVE'; }
    return 'NORMAL';
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private async loadConfig(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const snapshot = await this.configAdapter.getConfig(this.userId);
      this.userConfig = UserConfig.fromSnapshot(snapshot);
      this.startupColumnsDraft = [...this.userConfig.startupColumns];
      this.customTagsDraft = [...this.userConfig.customTags];
      this.taskLimitDraft = this.userConfig.defaultTaskLimit;

      // Load boards and their columns for the Column Types tab
      const boards = await this.boardRepository.findAll();
      const userBoards = boards.filter((b) => b.ownerId === this.userId);
      this.boardList = [];
      for (const board of userBoards) {
        const columns = await this.columnRepository.findByBoardId(board.id);
        this.boardList.push({ board, columns });
      }
    } catch {
      this.errorMessage = 'Failed to load settings. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  private reindexColumns(columns: StartupColumn[]): StartupColumn[] {
    return columns.map((col, i) => col.withPosition(i));
  }

  private nextCustomTagPosition(): number {
    // Only persisted tags (positive ids) occupy a real position in the backend.
    // Unsaved new rows use a negative temporary id, so they must be excluded
    // or the position would be incremented twice.
    const maxPersistedPosition = this.customTagsDraft
      .filter((tag) => tag.id > 0)
      .reduce((max, tag) => Math.max(max, tag.position), -1);
    return maxPersistedPosition + 1;
  }
}
