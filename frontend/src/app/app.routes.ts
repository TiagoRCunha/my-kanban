import { Routes } from '@angular/router';
import { authGuard } from './infrastructure/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'boards',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./ui/pages/login/login').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./ui/pages/register/register').then((m) => m.RegisterPage),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./ui/pages/forgot-password/forgot-password').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./ui/pages/reset-password/reset-password').then((m) => m.ResetPasswordPage),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./ui/pages/verify-email/verify-email').then((m) => m.VerifyEmailPage),
  },
  {
    path: 'boards',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./ui/pages/board-list/board-list').then((m) => m.BoardListPage),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./ui/pages/settings/settings').then((m) => m.SettingsPage),
  },
  {
    path: 'boards/:boardId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./ui/pages/board/board').then((m) => m.BoardPage),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./ui/pages/not-found/not-found').then((m) => m.NotFoundPage),
  },
];
