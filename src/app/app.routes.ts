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
    path: 'agregar-plato',
    loadComponent: () => import('./pages/agregar-plato/agregar-plato.page').then( m => m.AgregarPlatoPage)
  },
  {
    path: 'carta',
    loadComponent: () => import('./pages/carta/carta.page').then( m => m.CartaPage)
  },

];
