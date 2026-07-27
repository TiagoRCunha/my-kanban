import { Component, inject, OnInit } from '@angular/core';
import { Navbar } from '../../components/navbar';
import { ToggleSwitch } from '../../components/toggle-switch';
import { StartupColumnRow } from '../../components/startup-column-row';
import { CustomTagRow, CustomTagFormValue } from '../../components/custom-tag-row';
import { AnimatedButton } from '../../components/animated-button';
import { AuthService } from '../../../infrastructure/auth';
import { ThemeService } from '../../../infrastructure/theme/theme.service';
import { HttpUserConfigAdapter } from '../../../infrastructure/user-config';
import { UserConfig } from '../../../domain/users/entities/user-config.entity';
import { StartupColumn } from '../../../domain/users/entities/startup-column.entity';
import { CustomTagSettings } from '../../../domain/users/entities/custom-tag-settings.entity';

type SettingsTab = 'appearance' | 'startup-columns' | 'custom-tags';

@Component({
  selector: 'app-settings-page',
  imports: [Navbar, ToggleSwitch, StartupColumnRow, CustomTagRow, AnimatedButton],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly configAdapter = inject(HttpUserConfigAdapter);

  userConfig: UserConfig | null = null;
  isLoading = true;
  errorMessage = '';
  activeTab: SettingsTab = 'appearance';

  // Startup columns local draft
  startupColumnsDraft: StartupColumn[] = [];
  isSavingColumns = false;
  columnsSuccessMessage = '';

  // Custom tags local draft
  customTagsDraft: CustomTagSettings[] = [];
  isSavingTags = false;
  tagsSuccessMessage = '';

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

  async onToggleDarkMode(): Promise<void> {
    await this.themeService.toggleDarkMode(this.userId);
    this.userConfig = this.userConfig?.withDarkMode(this.themeService.darkMode) ?? null;
  }

  // ─── Startup Columns ─────────────────────────────────────────────────────

  addStartupColumn(): void {
    const nextPosition = this.startupColumnsDraft.length;
    const tempId = -(Date.now());
    this.startupColumnsDraft = [
      ...this.startupColumnsDraft,
      StartupColumn.fromCreateInput({ title: '', position: nextPosition }, tempId),
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

  async saveStartupColumns(): Promise<void> {
    this.isSavingColumns = true;
    this.columnsSuccessMessage = '';

    try {
      const commands = this.startupColumnsDraft.map((col, i) =>
        StartupColumn.toCommand({ title: col.title, position: i }),
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
    const nextPosition = this.customTagsDraft.length;
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
        await this.configAdapter.createCustomTag(this.userId, value);
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

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private async loadConfig(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const snapshot = await this.configAdapter.getConfig(this.userId);
      this.userConfig = UserConfig.fromSnapshot(snapshot);
      this.startupColumnsDraft = [...this.userConfig.startupColumns];
      this.customTagsDraft = [...this.userConfig.customTags];
    } catch {
      this.errorMessage = 'Failed to load settings. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  private reindexColumns(columns: StartupColumn[]): StartupColumn[] {
    return columns.map((col, i) => col.withPosition(i));
  }
}
