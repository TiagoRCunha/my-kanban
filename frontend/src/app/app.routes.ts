import { Routes } from '@angular/router';
import { BoardPage } from './ui/pages/board/board';

export const routes: Routes = [
  { path: '', redirectTo: 'board', pathMatch: 'full' },
  { path: 'board', component: BoardPage },
];
