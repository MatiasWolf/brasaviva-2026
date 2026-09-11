import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { AnonymousSessionService } from '../core/services/anonymous-session.service';
import { SesionAnonima } from '../core/models/sesion-anonima.model';
import { Router } from '@angular/router';
import { QrScannerComponent } from '../shared/components/qr-scanner/qr-scanner.component';
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
import { PushNotificationsService } from '../core/services/push-notifications.service';
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
    QrScannerComponent,
  ],
})
export class HomePage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly menu = inject(MenuService);
  private readonly router = inject(Router);
  private readonly anonymousSession = inject(AnonymousSessionService);
  private readonly pushNotifications = inject(PushNotificationsService);

  readonly usuario = signal<Usuario | null>(null);
  readonly sesionAnonima = signal<SesionAnonima | null>(null);
  readonly cargando = signal(true);
  readonly estadiaEstado = signal<EstadiaEstado>('sin_estadia');
  readonly mostrandoQrScanner = signal(false);
  readonly procesandoQr = signal(false);
  private rutaPendienteQr: string | null = null;

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
    const usuario = await this.auth.cargarUsuarioActual();
    if (usuario) {
      this.usuario.set(usuario);
      if (usuario.roles?.nombre === 'cliente_registrado') {
        const estado = usuario.estado_estadia ?? 'sin_estadia';
        this.estadiaEstado.set(estado);
      }
      if (['dueño', 'supervisor'].includes(usuario.roles?.nombre ?? '')) {
        void this.pushNotifications.inicializar(usuario.id);
      }
      this.botones.set(
        await this.menu.getBotonesPorRol(usuario.rol_id)
      );
      this.cargando.set(false);
      return;
    }
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
    await this.router.navigate(['/login'], {
      replaceUrl: true
    });
  }

  async ionViewWillEnter(): Promise<void> {
    this.procesandoQr.set(false);
    const usuario = await this.auth.cargarUsuarioActual();
    if (usuario) {
      this.usuario.set(usuario);
      if (usuario.roles?.nombre === 'cliente_registrado') {
        this.estadiaEstado.set(
          usuario.estado_estadia ?? 'sin_estadia'
        );
      }
      this.botones.set(
        await this.menu.getBotonesPorRol(usuario.rol_id)
      );
      return;
    }
    const sesionAnonima =
      await this.anonymousSession.obtenerSesion();
    if (sesionAnonima) {
      this.sesionAnonima.set(sesionAnonima);
      this.estadiaEstado.set(sesionAnonima.estado);
      this.botones.set(
        await this.menu.getBotonesPorRol(sesionAnonima.rol_id)
      );
    }
  }

  cambiarEstadia(event: CustomEvent): void {
    this.estadiaEstado.set((event.detail as { value: EstadiaEstado }).value);
  }

  async ejecutar(boton: BotonMenu): Promise<void> {
    if (boton.clave === 'escanear-qr-ingreso') {
      this.mostrandoQrScanner.set(true);
      return;
    }
    if (boton.ruta) {
      await this.router.navigateByUrl(boton.ruta);
      return;
    }
    console.log('Acción del menú:', boton.clave);
  }

  onQrEscaneado(texto: string): void {
    if (texto === 'BRASA_VIVA_INGRESO') {
      this.rutaPendienteQr = '/ingreso-lista-espera';
      this.procesandoQr.set(true);
    }

    this.mostrandoQrScanner.set(false);
  }

  cerrarQrScanner(): void {
    this.mostrandoQrScanner.set(false);

    if (this.rutaPendienteQr) {
      const ruta = this.rutaPendienteQr;
      this.rutaPendienteQr = null;

      this.router.navigate([ruta]);
    }
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

}
