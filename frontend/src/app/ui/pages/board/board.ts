import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Navbar } from '../../components/navbar';
import { BoardLayout } from '../../components/board-layout';
import { ShareDialog } from '../../components/share-dialog';
import { BOARD_MEMBER_REPOSITORY, BOARD_REPOSITORY } from '../../../infrastructure/di/repository-tokens';
import { Board } from '../../../domain/board/entities/board.entity';
import { BoardMemberRole } from '../../../domain/board/entities/board-member.entity';
import { BoardPermissions, getBoardPermissions } from '../../../domain/board/entities/board-permissions';
import { ListBoardMembersUseCase } from '../../../domain/board/use-cases/board-member/list-board-members.use-case';
import { AuthService } from '../../../infrastructure/auth';

@Component({
  selector: 'app-board-page',
  imports: [Navbar, BoardLayout, ShareDialog],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class BoardPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly boardRepository = inject(BOARD_REPOSITORY);
  private readonly authService = inject(AuthService);
  private readonly memberRepository = inject(BOARD_MEMBER_REPOSITORY);
  private readonly listMembersUseCase = new ListBoardMembersUseCase(this.memberRepository);

  board: Board | null = null;
  boardId = 0;
  isLoading = true;
  errorMessage = '';
  isShareDialogOpen = false;
  permissions: BoardPermissions = getBoardPermissions(null, false);

  async ngOnInit(): Promise<void> {
    const paramBoardId = Number(this.route.snapshot.paramMap.get('boardId'));

    if (!paramBoardId || isNaN(paramBoardId)) {
      this.router.navigate(['/boards']);
      return;
    }

    this.boardId = paramBoardId;
    await this.loadBoard();
  }

  private async loadBoard(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.board = await this.boardRepository.findById(this.boardId);
      await this.resolvePermissions();
    } catch {
      this.errorMessage = 'Failed to load board. It may not exist.';
    } finally {
      this.isLoading = false;
    }
  }

  private async resolvePermissions(): Promise<void> {
    if (!this.board) {
      return;
    }

    const userId = this.authService.user?.id ?? null;
    const isOwner = userId != null && this.board.ownerId === userId;

    if (isOwner) {
      this.permissions = getBoardPermissions(null, true);
      return;
    }

    try {
      const members = await this.listMembersUseCase.execute(this.board.id);
      const myRole = members.find((member) => member.userId === userId)?.role as BoardMemberRole | null;
      this.permissions = getBoardPermissions(myRole ?? null, false);
    } catch {
      // If the member list cannot be loaded, fall back to read-only access so
      // the board remains viewable but not editable for unverified memberships.
      this.permissions = getBoardPermissions(null, false);
    }
  }

  onOpenShareDialog(): void {
    this.isShareDialogOpen = true;
  }

  onCloseShareDialog(): void {
    this.isShareDialogOpen = false;
  }
}