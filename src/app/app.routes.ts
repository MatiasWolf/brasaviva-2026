import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { rolGuard } from './core/guards/rol.guard';

export const routes: Routes = [

  {
    path: 'splash-estatica',
    loadComponent: () =>
      import(
        './pages/splash-estatica/splash-estatica.page'
      ).then(
        (m) => m.SplashEstaticaPage
      ),
  },

  {
    path: 'splash-animada',
    loadComponent: () =>
      import(
        './pages/splash-animada/splash-animada.page'
      ).then(
        (m) => m.SplashAnimadaPage
      ),
  },

  {
    path: 'login',
    loadComponent: () =>
      import(
        './pages/login/login.page'
      ).then(
        (m) => m.LoginPage
      ),
  },

  {
    path: 'home',
    loadComponent: () =>
      import(
        './home/home.page'
      ).then(
        (m) => m.HomePage
      ),
    canActivate: [authGuard],
  },

  {
    path: 'registro',
    children: [

      {
        path: 'registro-cliente',
        loadComponent: () =>
          import(
            './pages/registro/registro-cliente/registro-cliente.page'
          ).then(
            (m) => m.RegistroClientePage
          ),
      },

      {
        path: 'cliente-anonimo',
        loadComponent: () =>
          import(
            './pages/registro/cliente-anonimo/registro.page'
          ).then(
            (m) => m.RegistroPage
          ),
      },

    ],
  },

  {
    path: 'empleados',
    loadComponent: () =>
      import(
        './pages/empleados/listado-empleados/listado-empleados.page'
      ).then(
        (m) => m.ListadoEmpleadosPage
      ),
    canActivate: [
      authGuard,
      rolGuard([
        'dueño',
        'supervisor'
      ])
    ],
  },

  {
    path: 'empleados/nuevo',
    loadComponent: () =>
      import(
        './pages/empleados/alta-empleado/alta-empleado.page'
      ).then(
        (m) => m.AltaEmpleadoPage
      ),
    canActivate: [
      authGuard,
      rolGuard([
        'dueño',
        'supervisor'
      ])
    ],
  },

  {
    path: 'empleados/:id/editar',
    loadComponent: () =>
      import(
        './pages/empleados/editar-empleado/editar-empleado.page'
      ).then(
        (m) => m.EditarEmpleadoPage
      ),
    canActivate: [
      authGuard,
      rolGuard([
        'dueño',
        'supervisor'
      ])
    ],
  },

  {
    path: 'agregar-plato',
    loadComponent: () =>
      import(
        './pages/agregar-plato/agregar-plato.page'
      ).then(
        (m) => m.AgregarPlatoPage
      ),
    canActivate: [
      authGuard,
      rolGuard([
        'dueño',
        'supervisor',
        'cocinero'
      ])
    ],
  },

  {
    path: 'carta',
    loadComponent: () =>
      import(
        './pages/carta/carta.page'
      ).then(
        (m) => m.CartaPage
      ),
  },

  {
    path: 'agregar-bebida',
    loadComponent: () =>
      import(
        './pages/agregar-bebida/agregar-bebida.page'
      ).then(
        (m) => m.AgregarBebidaPage
      ),
    canActivate: [
      authGuard,
      rolGuard([
        'dueño',
        'supervisor',
        'cantinero'
      ])
    ],
  },

  {
    path: 'carta-bebidas',
    loadComponent: () =>
      import(
        './pages/carta-bebidas/carta-bebidas.page'
      ).then(
        (m) => m.CartaBebidasPage
      ),
  },

  {
    path: 'ingreso-lista-espera',
    loadComponent: () =>
      import(
        './pages/lista-espera/ingreso-lista-espera/ingreso-lista-espera.page'
      ).then(
        (m) => m.IngresoListaEsperaPage
      ),
  },

  {
    path: 'lista-espera',
    loadComponent: () =>
      import(
        './pages/lista-espera/lista-espera/lista-espera.page'
      ).then(
        (m) => m.ListaEsperaPage
      ),
    canActivate: [
      authGuard,
      rolGuard([
        'dueño',
        'supervisor',
        'metre'
      ])
    ],
  },

  {
    path: 'mesas',
    loadComponent: () =>
      import(
        './pages/mesas/listado-mesas/listado-mesas.page'
      ).then(
        (m) => m.ListadoMesasPage
      ),
    canActivate: [
      authGuard,
      rolGuard([
        'dueño',
        'supervisor'
      ])
    ],
  },

  {
    path: 'mesas/nueva',
    loadComponent: () =>
      import(
        './pages/mesas/agregar-mesa/agregar-mesa.page'
      ).then(
        (m) => m.AgregarMesaPage
      ),
    canActivate: [
      authGuard,
      rolGuard([
        'dueño',
        'supervisor'
      ])
    ],
  },

  {
    path: 'menu-productos',
    loadComponent: () =>
      import(
        './pages/menu-productos/menu-productos.page'
      ).then(
        (m) => m.MenuProductosPage
      ),
  },

  {
    path: 'clientes-pendientes',
    loadComponent: () =>
      import(
        './pages/clientes/listado-clientes-pendientes/listado-clientes-pendientes.page'
      ).then(
        (m) => m.ListadoClientesPendientesPage
      ),
    canActivate: [
      authGuard,
      rolGuard([
        'dueño',
        'supervisor'
      ])
    ],
  },

  {
    path: 'chat',
    loadComponent: () =>
      import(
        './pages/chat/chat.page'
      ).then(
        (m) => m.ChatPage
      ),
  },

  {
    path: 'mozos-chat',
    loadComponent: () =>
      import(
        './pages/mozos-chat/mozos-chat.page'
      ).then(
        (m) => m.MozosChatPage
      ),
  },

  {
    path: 'pedidos/cocina',
    loadComponent: () =>
      import(
        './pages/pedidos/sector-pedidos/sector-pedidos.page'
      ).then(
        (m) => m.SectorPedidosPage
      ),
    data: {
      sector: 'cocina'
    },
    canActivate: [
      authGuard,
      rolGuard([
        'dueño',
        'supervisor',
        'cocinero'
      ])
    ],
  },

  {
    path: 'pedidos/bar',
    loadComponent: () =>
      import(
        './pages/pedidos/sector-pedidos/sector-pedidos.page'
      ).then(
        (m) => m.SectorPedidosPage
      ),
    data: {
      sector: 'bar'
    },
    canActivate: [
      authGuard,
      rolGuard([
        'dueño',
        'supervisor',
        'cantinero'
      ])
    ],
  },

  {
    path: 'pedidos/listos',
    loadComponent: () =>
      import(
        './pages/pedidos/pedidos-listos/pedidos-listos.page'
      ).then(
        (m) => m.PedidosListosPage
      ),
    canActivate: [
      authGuard,
      rolGuard([
        'dueño',
        'supervisor',
        'mozo'
      ])
    ],
  },

  {
    path: 'seguimiento-pedido',
    loadComponent: () =>
      import(
        './pages/pedidos/seguimiento-pedido/seguimiento-pedido.page'
      ).then(
        (m) => m.SeguimientoPedidoPage
      ),
  },

  {
    path: 'juegos',
    loadComponent: () =>
      import(
        './pages/juegos/juegos/juegos.page'
      ).then(
        (m) => m.JuegosPage
      ),
  },

  {
    path: 'juegos/memoria',
    loadComponent: () =>
      import(
        './pages/juegos/memoria/memoria.page'
      ).then(
        (m) => m.MemoriaPage
      ),
  },

  {
    path: 'juegos/reflejos',
    loadComponent: () =>
      import(
        './pages/juegos/reflejos/reflejos.page'
      ).then(
        (m) => m.ReflejosPage
      ),
  },

  {
    path: 'juegos/trivia',
    loadComponent: () =>
      import(
        './pages/juegos/trivia/trivia.page'
      ).then(
        (m) => m.TriviaPage
      ),
  },

  {
    path: '',
    redirectTo: 'splash-estatica',
    pathMatch: 'full',
  },

];