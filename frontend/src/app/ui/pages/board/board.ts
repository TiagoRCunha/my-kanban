import { Component } from '@angular/core';
import { Navbar } from '../../components/navbar';
import { BoardLayout } from '../../components/board-layout';

@Component({
  selector: 'app-board-page',
  imports: [Navbar, BoardLayout],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class BoardPage {}
