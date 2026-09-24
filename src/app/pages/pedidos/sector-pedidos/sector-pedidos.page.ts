import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ToastController,
  ViewDidLeave,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  beerOutline,
  calendarOutline,
  checkmarkDoneOutline,
  checkmarkOutline,
  flameOutline,
  hourglassOutline,
  playOutline,
  restaurantOutline,
  timeOutline,
} from 'ionicons/icons';

import { PedidosSectorService } from '../../../core/services/pedidos-sector.service';
import {
  EstadoPedidoItem,
  ItemPedidoVista,
  PedidoVista,
  SECTORES,
  SectorPedido,
} from '../../../core/models/pedido.models';
import { SpinnerLogoComponent } from '../../../shared/components/spinner-logo/spinner-logo.component';
import { traducirErrorSupabase } from '../../../core/utils/traducir-error.util';

/** Las comandas van agrupadas por mesa, como pide el enunciado. */
interface GrupoMesa {
  mesa_numero: number;
  pedidos: PedidoVista[];
}

/**
 * Puntos 16 y 17 - Cocina y bar reciben los pedidos.
 * Una sola pantalla para los dos: cambia solo el sector, que viene en la data
 * de la ruta (/pedidos/cocina y /pedidos/bar).
 */
@Component({
  selector: 'app-sector-pedidos',
  templateUrl: './sector-pedidos.page.html',
  styleUrls: ['./sector-pedidos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonIcon,
    SpinnerLogoComponent,
  ],
})
export class SectorPedidosPage implements ViewWillEnter, ViewDidLeave {
  private readonly pedidosService = inject(PedidosSectorService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly toastCtrl = inject(ToastController);
  private readonly destroyRef = inject(DestroyRef);

  readonly sector: SectorPedido =
    (this.ruta.snapshot.data['sector'] as SectorPedido) ?? 'cocina';

  readonly titulo = SECTORES[this.sector].titulo;
  readonly icono = SECTORES[this.sector].icono;

  readonly pedidos = signal<PedidoVista[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly guardando = signal<number | null>(null);

  /** Se refresca solo para que los minutos de espera no queden congelados. */
  private readonly ahora = signal(Date.now());

  private canal: RealtimeChannel | null = null;
  private reloj: ReturnType<typeof setInterval> | null = null;
  private idsConocidos = new Set<number>();
  private primeraCarga = true;

  /** Comandas que todavía tienen algo por hacer en este sector. */
  readonly pendientes = computed(() =>
    this.pedidos().filter((p) =>
      this.itemsDelSector(p).some((i) => i.estado_item !== 'listo'),
    ),
  );

  /** Ya terminadas por este sector; quedan a la vista hasta que se entregan. */
  readonly terminados = computed(() =>
    this.pedidos().filter((p) =>
      this.itemsDelSector(p).every((i) => i.estado_item === 'listo'),
    ),
  );

  readonly gruposPendientes = computed(() => this.agrupar(this.pendientes()));
  readonly gruposTerminados = computed(() => this.agrupar(this.terminados()));

  /** Cuántas comandas hay en total, para el contador del encabezado. */
  readonly totalPendientes = computed(() => this.pendientes().length);

  /** Junta los pedidos de una misma mesa, conservando el orden de llegada. */
  private agrupar(lista: PedidoVista[]): GrupoMesa[] {
    const grupos = new Map<number, PedidoVista[]>();

    for (const pedido of lista) {
      const actual = grupos.get(pedido.mesa_numero);

      if (actual) {
        actual.push(pedido);
      } else {
        grupos.set(pedido.mesa_numero, [pedido]);
      }
    }

    return [...grupos.entries()].map(([mesa_numero, pedidos]) => ({
      mesa_numero,
      pedidos,
    }));
  }

  constructor() {
    addIcons({
      'flame-outline': flameOutline,
      'beer-outline': beerOutline,
      'calendar-outline': calendarOutline,
      'restaurant-outline': restaurantOutline,
      'time-outline': timeOutline,
      'hourglass-outline': hourglassOutline,
      'play-outline': playOutline,
      'checkmark-outline': checkmarkOutline,
      'checkmark-done-outline': checkmarkDoneOutline,
    });

    // Con el boton de atras del sistema ionViewDidLeave no siempre corre.
    this.destroyRef.onDestroy(() => this.desconectar());
  }

  async ionViewWillEnter(): Promise<void> {
    await this.cargar();
    this.conectar();
  }

  ionViewDidLeave(): void {
    this.desconectar();
  }

  async cargar(): Promise<void> {
    this.error.set('');

    try {
      const lista = await this.pedidosService.listarPorSector(this.sector);
      this.avisarNuevos(lista);
      this.pedidos.set(lista);
    } catch (e) {
      this.error.set(
        traducirErrorSupabase(e, 'No se pudieron cargar los pedidos. Revisá la conexión.'),
      );
      this.vibrar();
    } finally {
      this.cargando.set(false);
    }
  }

  /** Ítems que le corresponden a este sector dentro de la comanda. */
  itemsDelSector(pedido: PedidoVista): ItemPedidoVista[] {
    return pedido.items.filter((i) => i.sector === this.sector);
  }

  /** Minutos desde que entró la comanda, para priorizar lo que más espera. */
  minutosEsperando(pedido: PedidoVista): number {
    return Math.max(
      0,
      Math.floor((this.ahora() - new Date(pedido.created_at).getTime()) / 60000),
    );
  }

  /** Una comanda que espera hace rato se marca en rojo. */
  esDemorado(pedido: PedidoVista): boolean {
    return this.minutosEsperando(pedido) >= 20;
  }

  tiempoEstimado(pedido: PedidoVista): number {
    const items = this.itemsDelSector(pedido);
    return items.length ? Math.max(...items.map((i) => i.tiempo_preparacion)) : 0;
  }

  async empezarItem(item: ItemPedidoVista): Promise<void> {
    await this.cambiarItem(item, 'en_preparacion');
  }

  async terminarItem(item: ItemPedidoVista): Promise<void> {
    await this.cambiarItem(item, 'listo');
  }

  /** Atajo real de la cocina: la comanda entera sale junta. */
  async terminarComanda(pedido: PedidoVista): Promise<void> {
    this.guardando.set(pedido.id);

    try {
      await this.pedidosService.marcarSector(pedido.id, this.sector, 'listo');
      await this.cargar();
      await this.mostrarToast(
        'Mesa ' + pedido.mesa_numero + ': comanda lista.',
        'success',
      );
    } catch (e) {
      await this.mostrarToast(
        traducirErrorSupabase(e, 'No se pudo marcar la comanda como lista.'),
        'danger',
      );
      this.vibrar();
    } finally {
      this.guardando.set(null);
    }
  }

  private async cambiarItem(
    item: ItemPedidoVista,
    estado: EstadoPedidoItem,
  ): Promise<void> {
    this.guardando.set(item.pedido_id);

    try {
      await this.pedidosService.marcarItem(item.id, estado);
      await this.cargar();
    } catch (e) {
      await this.mostrarToast(
        traducirErrorSupabase(e, 'No se pudo actualizar el producto.'),
        'danger',
      );
      this.vibrar();
    } finally {
      this.guardando.set(null);
    }
  }

  // ------------------------------------------------------------------ realtime

  private conectar(): void {
    this.canal ??= this.pedidosService.escucharCambios(
      'pedidos-sector-' + this.sector,
      () => void this.cargar(),
    );

    this.reloj ??= setInterval(() => this.ahora.set(Date.now()), 30_000);
  }

  private desconectar(): void {
    void this.pedidosService.cerrarCanal(this.canal);
    this.canal = null;

    if (this.reloj) {
      clearInterval(this.reloj);
      this.reloj = null;
    }
  }

  /** Avisa con toast y vibración cuando entra una comanda que no estaba. */
  private avisarNuevos(lista: PedidoVista[]): void {
    const nuevos = lista.filter((p) => !this.idsConocidos.has(p.id));
    this.idsConocidos = new Set(lista.map((p) => p.id));

    // En la primera carga no se avisa: ya estaban antes de abrir la pantalla.
    if (this.primeraCarga) {
      this.primeraCarga = false;
      return;
    }

    if (nuevos.length === 0) {
      return;
    }

    const mesas = nuevos.map((p) => p.mesa_numero).join(', ');
    this.vibrar();
    void this.mostrarToast(
      nuevos.length === 1
        ? 'Nueva comanda de la mesa ' + mesas + '.'
        : 'Nuevas comandas de las mesas ' + mesas + '.',
      'success',
    );
  }

  // ------------------------------------------------------------------ avisos

  private vibrar(): void {
    try {
      navigator.vibrate?.([120, 60, 120]);
    } catch {
      // Si el dispositivo no vibra no pasa nada: el toast ya avisó.
    }
  }

  private async mostrarToast(
    message: string,
    color: 'success' | 'danger',
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'top',
      color,
    });
    await toast.present();
  }
}
