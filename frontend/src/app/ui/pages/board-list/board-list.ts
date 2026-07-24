import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Navbar } from '../../components/navbar';
import { BoardCreatorDialog, BoardCreatorFormValue } from '../../components/board-creator-dialog';
import { HttpBoardRepository } from '../../../infrastructure/board';
import { Board } from '../../../domain/board/entities/board.entity';
import { AuthService } from '../../../infrastructure/auth/auth.service';

@Component({
  selector: 'app-board-list-page',
  imports: [Navbar, BoardCreatorDialog],
  templateUrl: './board-list.html',
  styleUrl: './board-list.scss',
})
export class BoardListPage implements OnInit {
  private readonly boardRepository = inject(HttpBoardRepository);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @ViewChild(BoardCreatorDialog) boardCreatorDialog!: BoardCreatorDialog;

  boards: Board[] = [];
  isLoading = true;
  errorMessage = '';
  isCreating = false;

  async ngOnInit(): Promise<void> {
    await this.loadBoards();
  }

  async loadBoards(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.boards = await this.boardRepository.findAll();
    } catch {
      this.errorMessage = 'Failed to load boards. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  openCreatorDialog(): void {
    this.boardCreatorDialog.open();
  }

  async onCreateBoard(formValue: BoardCreatorFormValue): Promise<void> {
    this.isCreating = true;
    this.errorMessage = '';

    try {
      const user = this.authService.user;
      const ownerId = user?.id ?? 0;

      await this.boardRepository.create({
        title: formValue.title,
        description: formValue.description || null,
        ownerId,
      });

      await this.loadBoards();
    } catch {
      this.errorMessage = 'Failed to create board. Please try again.';
    } finally {
      this.isCreating = false;
    }
  }

  navigateToBoard(boardId: number): void {
    this.router.navigate(['/boards', boardId]);
  }

  trackByBoardId(_index: number, board: Board): number {
    return board.id;
  }
}
