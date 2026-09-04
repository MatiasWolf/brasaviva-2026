import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },  {
    path: 'menu-productos',
    loadComponent: () => import('./pages/menu-productos/menu-productos.page').then( m => m.MenuProductosPage)
  },

];
