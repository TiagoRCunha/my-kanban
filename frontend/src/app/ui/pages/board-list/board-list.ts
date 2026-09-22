import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Navbar } from '../../components/navbar';
import { BoardCreatorDialog, BoardCreatorFormValue } from '../../components/board-creator-dialog';
import { BOARD_REPOSITORY } from '../../../infrastructure/di/repository-tokens';
import { Board } from '../../../domain/board/entities/board.entity';
import { AuthService } from '../../../infrastructure/auth/auth.service';

@Component({
  selector: 'app-board-list-page',
  imports: [Navbar, BoardCreatorDialog],
  templateUrl: './board-list.html',
  styleUrl: './board-list.scss',
})
export class BoardListPage implements OnInit {
  private readonly boardRepository = inject(BOARD_REPOSITORY);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @ViewChild(BoardCreatorDialog) boardCreatorDialog!: BoardCreatorDialog;

  boards: Board[] = [];
  isLoading = true;
  errorMessage = '';
  isSaving = false;

  private editingBoard: { id: number; title: string; description: string } | null = null;

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
    this.editingBoard = null;
    this.boardCreatorDialog.open();
  }

  onEditBoard(board: Board): void {
    this.editingBoard = {
      id: board.id,
      title: board.title,
      description: board.description ?? '',
    };
    this.boardCreatorDialog.openForEdit(this.editingBoard.title, this.editingBoard.description);
  }

  onDialogClose(): void {
    this.editingBoard = null;
  }

  async onSaveBoard(formValue: BoardCreatorFormValue): Promise<void> {
    if (this.editingBoard) {
      await this.onUpdateBoard(formValue);
    } else {
      await this.onCreateBoard(formValue);
    }
  }

  async onCreateBoard(formValue: BoardCreatorFormValue): Promise<void> {
    this.isSaving = true;
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
      this.isSaving = false;
    }
  }

  private async onUpdateBoard(formValue: BoardCreatorFormValue): Promise<void> {
    const boardId = this.editingBoard!.id;
    this.isSaving = true;
    this.errorMessage = '';

    try {
      await this.boardRepository.update(boardId, {
        title: formValue.title,
        description: formValue.description || null,
        ownerId: this.authService.user?.id ?? 0,
      });

      await this.loadBoards();
    } catch {
      this.errorMessage = 'Failed to update board. Please try again.';
    } finally {
      this.isSaving = false;
      this.editingBoard = null;
    }
  }

  navigateToBoard(boardId: number): void {
    this.router.navigate(['/boards', boardId]);
  }

  isBoardOwner(board: Board): boolean {
    const userId = this.authService.user?.id;
    return userId != null && board.ownerId === userId;
  }

  canEditBoard(board: Board): boolean {
    return this.isBoardOwner(board);
  }

  canLeaveBoard(board: Board): boolean {
    return !this.isBoardOwner(board);
  }

  async onLeaveBoard(boardId: number): Promise<void> {
    if (this.isOwnedBoard(boardId)) {
      return;
    }

    try {
      await this.boardRepository.leaveBoard(boardId);
      await this.loadBoards();
    } catch {
      this.errorMessage = 'Failed to leave board. Please try again.';
    }
  }

  private isOwnedBoard(boardId: number): boolean {
    return this.boards.some((board) => board.id === boardId && this.isBoardOwner(board));
  }

  trackByBoardId(_index: number, board: Board): number {
    return board.id;
  }
}
