import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'splash-estatica',
    loadComponent: () =>
      import('./pages/splash-estatica/splash-estatica.page').then((m) => m.SplashEstaticaPage),
  },
  {
    path: 'splash-animada',
    loadComponent: () =>
      import('./pages/splash-animada/splash-animada.page').then((m) => m.SplashAnimadaPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'splash-estatica',
    pathMatch: 'full',
  },
];
