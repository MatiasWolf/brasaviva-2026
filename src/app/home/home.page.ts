import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { AnonymousSessionService } from '../core/services/anonymous-session.service';
import { SesionAnonima } from '../core/models/sesion-anonima.model';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonLabel,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  analyticsOutline,
  barChartOutline,
  beerOutline,
  bookOutline,
  cardOutline,
  cartOutline,
  cashOutline,
  chatbubblesOutline,
  clipboardOutline,
  flameOutline,
  gameControllerOutline,
  gridOutline,
  helpCircleOutline,
  hourglassOutline,
  locationOutline,
  logOutOutline,
  peopleOutline,
  personAddOutline,
  personCircleOutline,
  qrCodeOutline,
  restaurantOutline,
  starOutline,
  timeOutline,
  wineOutline,
} from 'ionicons/icons';

import { AuthService } from '../core/services/auth.service';
import { MenuService } from '../core/services/menu.service';
import { Usuario } from '../core/models/usuario.model';
import {
  BotonMenu,
  ESTADIA_ESTADOS,
  EstadiaEstado,
  ROLES_CLIENTE,
} from '../core/models/boton-menu.model';
import { SpinnerLogoComponent } from '../shared/components/spinner-logo/spinner-logo.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    TitleCasePipe,
    IonContent,
    IonIcon,
    IonButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    SpinnerLogoComponent,
  ],
})
export class HomePage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly menu = inject(MenuService);
  private readonly router = inject(Router);
  private readonly anonymousSession = inject(AnonymousSessionService);

  readonly usuario = signal<Usuario | null>(null);
  readonly sesionAnonima = signal<SesionAnonima | null>(null);
  readonly cargando = signal(true);
  readonly estadiaEstado = signal<EstadiaEstado>('sin_estadia');

  readonly estadiaEstados = ESTADIA_ESTADOS;

  private readonly botones = signal<BotonMenu[]>([]);

  readonly rolNombreLegible = computed(() => {
    const usuario = this.usuario();
    const anonimo = this.sesionAnonima();

    if (usuario) {
      return (usuario.roles?.nombre ?? '').replace(/_/g, ' ');
    }

    if (anonimo) {
      return 'cliente anónimo';
    }

    return '';
  });

  readonly esCliente = computed(() => {
    const rol = this.usuario()?.roles?.nombre
      ?? (this.sesionAnonima() ? 'cliente_anonimo' : '');

    return ROLES_CLIENTE.includes(rol);
  });

  readonly saludo = computed(() => {
    const nombre =
      this.usuario()?.nombre
      ?? this.sesionAnonima()?.nombre;

    return nombre ? `Hola, ${nombre}` : 'Bienvenido';
  });

  readonly botonesVisibles = computed(() => {
    if (!this.esCliente()) {
      return this.botones();
    }

    const estado = this.estadiaEstado();
    return this.botones().filter(
      (boton) => boton.contexto === 'siempre' || boton.contexto === estado,
    );
  });

  constructor() {
    addIcons({
      analyticsOutline,
      barChartOutline,
      beerOutline,
      bookOutline,
      cardOutline,
      cartOutline,
      cashOutline,
      chatbubblesOutline,
      clipboardOutline,
      flameOutline,
      gameControllerOutline,
      gridOutline,
      helpCircleOutline,
      hourglassOutline,
      locationOutline,
      logOutOutline,
      peopleOutline,
      personAddOutline,
      personCircleOutline,
      qrCodeOutline,
      restaurantOutline,
      starOutline,
      timeOutline,
      wineOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    // Primero buscamos un usuario registrado
    const usuario = await this.auth.cargarUsuarioActual();

    if (usuario) {
      this.usuario.set(usuario);

      this.botones.set(
        await this.menu.getBotonesPorRol(usuario.rol_id)
      );

      this.cargando.set(false);
      return;
    }

    // Si no hay usuario registrado, buscamos sesión anónima
    const sesionAnonima =
      await this.anonymousSession.obtenerSesion();

    if (sesionAnonima) {
      this.sesionAnonima.set(sesionAnonima);
      this.estadiaEstado.set(sesionAnonima.estado);

      this.botones.set(
        await this.menu.getBotonesPorRol(sesionAnonima.rol_id)
      );

      this.cargando.set(false);
      return;
    }

    // No hay ningún tipo de sesión
    await this.router.navigate(['/login'], {
      replaceUrl: true
    });
  }

  cambiarEstadia(event: CustomEvent): void {
    this.estadiaEstado.set((event.detail as { value: EstadiaEstado }).value);
  }

  async ejecutar(boton: BotonMenu): Promise<void> {
    if (boton.ruta) {
      await this.router.navigateByUrl(boton.ruta);
      return;
    }
    console.log('Acción del menú:', boton.clave);
  }

  async cerrarSesion(): Promise<void> {
    if (this.sesionAnonima()) {
      await this.anonymousSession.cerrarSesion();
    } else {
      await this.auth.logout();
    }

    await this.router.navigate(['/login'], {
      replaceUrl: true
    });
  }

  irAListaEspera(): void {
    this.router.navigate(['/lista-espera']);
  }
}
