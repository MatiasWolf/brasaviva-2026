import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { rolGuard } from './core/guards/rol.guard';

export const routes: Routes = [
  {
    path: 'splash-estatica',
    loadComponent: () =>
      import('./pages/splash-estatica/splash-estatica.page').then(
        (m) => m.SplashEstaticaPage
      ),
  },
  {
    path: 'splash-animada',
    loadComponent: () =>
      import('./pages/splash-animada/splash-animada.page').then(
        (m) => m.SplashAnimadaPage
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.page').then((m) => m.HomePage),
    canActivate: [authGuard],
  },
  {
    path: 'registro',
    children: [
      {
        path: 'registro-cliente',
        loadComponent: () =>
          import('./pages/registro/registro-cliente/registro-cliente.page')
            .then((m) => m.RegistroClientePage),
      },
      {
        path: 'cliente-anonimo',
        loadComponent: () =>
          import('./pages/registro/cliente-anonimo/registro.page')
            .then((m) => m.RegistroPage),
      },
    ],
  },
  {
    path: 'empleados',
    loadComponent: () =>
      import(
        './pages/empleados/listado-empleados/listado-empleados.page'
      ).then((m) => m.ListadoEmpleadosPage),
    canActivate: [authGuard, rolGuard(['metre'])],
  },
  {
    path: 'empleados/nuevo',
    loadComponent: () =>
      import('./pages/empleados/alta-empleado/alta-empleado.page').then(
        (m) => m.AltaEmpleadoPage
      ),
    canActivate: [authGuard, rolGuard(['dueño', 'supervisor'])],
  },
  {
    path: 'empleados/:id/editar',
    loadComponent: () =>
      import('./pages/empleados/editar-empleado/editar-empleado.page').then(
        (m) => m.EditarEmpleadoPage
      ),
    canActivate: [authGuard, rolGuard(['dueño', 'supervisor'])],
  },
  {
    path: 'agregar-plato',
    loadComponent: () =>
      import('./pages/agregar-plato/agregar-plato.page').then(
        (m) => m.AgregarPlatoPage
      ),
    canActivate: [authGuard, rolGuard(['dueño', 'supervisor', 'cocinero'])],
  },
  {
    path: 'carta',
    loadComponent: () =>
      import('./pages/carta/carta.page').then((m) => m.CartaPage),
  },
  {
    path: 'agregar-bebida',
    loadComponent: () =>
      import('./pages/agregar-bebida/agregar-bebida.page').then(
        (m) => m.AgregarBebidaPage
      ),
    canActivate: [authGuard, rolGuard(['dueño', 'supervisor', 'cantinero'])],
  },
  {
    path: 'carta-bebidas',
    loadComponent: () =>
      import('./pages/carta-bebidas/carta-bebidas.page').then(
        (m) => m.CartaBebidasPage
      ),
  },
  {
    path: 'ingreso-lista-espera',
    loadComponent: () =>
      import('./pages/lista-espera/ingreso-lista-espera/ingreso-lista-espera.page')
        .then(m => m.IngresoListaEsperaPage),
  },
  {
    path: 'lista-espera',
    loadComponent: () =>
      import('./pages/lista-espera/lista-espera/lista-espera.page')
        .then(m => m.ListaEsperaPage),
    canActivate: [authGuard, rolGuard(['dueño', 'supervisor', 'metre'])],
  },
  {
    path: 'mesas',
    loadComponent: () =>
      import('./pages/mesas/listado-mesas/listado-mesas.page').then(
        (m) => m.ListadoMesasPage
      ),
    canActivate: [authGuard, rolGuard(['dueño', 'supervisor'])],
  },
  {
    path: 'mesas/nueva',
    loadComponent: () =>
      import('./pages/mesas/agregar-mesa/agregar-mesa.page').then(
        (m) => m.AgregarMesaPage
      ),
    canActivate: [authGuard, rolGuard(['dueño', 'supervisor'])],
  },
  {
    path: '',
    redirectTo: 'splash-estatica',
    pathMatch: 'full',
  },

];