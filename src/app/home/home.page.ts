import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
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

  readonly usuario = signal<Usuario | null>(null);
  readonly cargando = signal(true);
  readonly estadiaEstado = signal<EstadiaEstado>('sin_estadia');

  readonly estadiaEstados = ESTADIA_ESTADOS;

  private readonly botones = signal<BotonMenu[]>([]);

  readonly rolNombreLegible = computed(() =>
    (this.usuario()?.roles?.nombre ?? '').replace(/_/g, ' '),
  );

  readonly esCliente = computed(() =>
    ROLES_CLIENTE.includes(this.usuario()?.roles?.nombre ?? ''),
  );

  readonly saludo = computed(() => {
    const nombre = this.usuario()?.nombre;
    return nombre ? `Hola, ${nombre}` : 'Bienvenido';
  });

  /** Empleados: todos sus botones. Clientes: sólo los de la fase actual + los fijos. */
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
    this.usuario.set(usuario);

    if (!usuario) {
      await this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }

    this.botones.set(await this.menu.getBotonesPorRol(usuario.rol_id));
    this.cargando.set(false);
  }

  cambiarEstadia(event: CustomEvent): void {
    this.estadiaEstado.set((event.detail as { value: EstadiaEstado }).value);
  }

  // Solo demo por ahora, no hace nada real.
  ejecutar(boton: BotonMenu): void {
    console.log('Acción del menú:', boton.clave);
  }

  async cerrarSesion(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login'], { replaceUrl: true });
  }
}
