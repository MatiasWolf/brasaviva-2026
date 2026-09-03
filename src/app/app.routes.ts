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
    path: 'registro-cliente',
    loadComponent: () => import('./pages/registro-cliente/registro-cliente.page').then( m => m.RegistroClientePage)
  },
  {
    path: 'agregar-bebida',
    loadComponent: () => import('./pages/agregar-bebida/agregar-bebida.page').then( m => m.AgregarBebidaPage)
  },
  {
    path: 'carta-bebidas',
    loadComponent: () => import('./pages/carta-bebidas/carta-bebidas.page').then( m => m.CartaBebidasPage)
  },

];
