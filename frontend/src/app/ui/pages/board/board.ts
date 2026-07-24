import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Navbar } from '../../components/navbar';
import { BoardLayout } from '../../components/board-layout';
import { HttpBoardRepository } from '../../../infrastructure/board';
import { Board } from '../../../domain/board/entities/board.entity';

@Component({
  selector: 'app-board-page',
  imports: [Navbar, BoardLayout],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class BoardPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly boardRepository = inject(HttpBoardRepository);

  board: Board | null = null;
  boardId = 0;
  isLoading = true;
  errorMessage = '';

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
    } catch {
      this.errorMessage = 'Failed to load board. It may not exist.';
    } finally {
      this.isLoading = false;
    }
  }
}
