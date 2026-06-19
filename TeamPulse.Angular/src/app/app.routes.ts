import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
