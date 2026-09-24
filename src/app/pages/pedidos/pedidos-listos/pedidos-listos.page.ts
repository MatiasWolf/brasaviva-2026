import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  hourglassOutline,
  notificationsOutline,
  restaurantOutline,
  timeOutline,
} from 'ionicons/icons';

import { PedidosSectorService } from '../../../core/services/pedidos-sector.service';
import {
  EstadoPedidoItem,
  PedidoVista,
  SectorPedido,
} from '../../../core/models/pedido.models';
import { SpinnerLogoComponent } from '../../../shared/components/spinner-logo/spinner-logo.component';
import { traducirErrorSupabase } from '../../../core/utils/traducir-error.util';

/** Como viene cada parte del pedido: la de cocina y la de bar. */
interface ParteSector {
  sector: SectorPedido;
  estado: EstadoPedidoItem;
  cantidadItems: number;
}

/**
 * Punto 18 - Pedidos pendientes del mozo.
 *
 * Muestra los pedidos completos y, aparte, los que todavia estan en los
 * sectores con el detalle de como viene cada uno. El pase a "listo" lo hace un
 * trigger de la base cuando cocina y bar terminan, y eso dispara el push y el
 * refresco por realtime de esta pantalla.
 */
@Component({
  selector: 'app-pedidos-listos',
  templateUrl: './pedidos-listos.page.html',
  styleUrls: ['./pedidos-listos.page.scss'],
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
export class PedidosListosPage implements ViewWillEnter, ViewDidLeave {
  private readonly pedidosService = inject(PedidosSectorService);
  private readonly toastCtrl = inject(ToastController);
  private readonly destroyRef = inject(DestroyRef);

  readonly pedidos = signal<PedidoVista[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly entregando = signal<number | null>(null);

  private readonly ahora = signal(Date.now());

  private canal: RealtimeChannel | null = null;
  private reloj: ReturnType<typeof setInterval> | null = null;
  private idsListosConocidos = new Set<number>();
  private primeraCarga = true;

  /** Completos: cocina y bar terminaron todo. Son los que hay que llevar ya. */
  readonly listos = computed(() =>
    this.pedidos().filter((p) => p.estado === 'listo'),
  );

  /** Todavía en los sectores. El mozo los ve para saber qué está por salir. */
  readonly enPreparacion = computed(() =>
    this.pedidos().filter((p) => p.estado !== 'listo'),
  );

  readonly hayPedidos = computed(() => this.pedidos().length > 0);

  constructor() {
    addIcons({
      'notifications-outline': notificationsOutline,
      'checkmark-done-outline': checkmarkDoneOutline,
      'hourglass-outline': hourglassOutline,
      'time-outline': timeOutline,
      'calendar-outline': calendarOutline,
      'restaurant-outline': restaurantOutline,
      'beer-outline': beerOutline,
    });

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
      const lista = await this.pedidosService.listarPendientesDelMozo();
      this.avisarCompletos(lista);
      this.pedidos.set(lista);
    } catch (e) {
      this.error.set(
        traducirErrorSupabase(e, 'No se pudieron cargar los pedidos.'),
      );
      this.vibrar();
    } finally {
      this.cargando.set(false);
    }
  }

  /** El estado de cada sector dentro del pedido. */
  partes(pedido: PedidoVista): ParteSector[] {
    const sectores: SectorPedido[] = ['cocina', 'bar'];

    return sectores
      .map((sector) => {
        const items = pedido.items.filter((i) => i.sector === sector);

        if (items.length === 0) {
          return null;
        }

        const todosListos = items.every((i) => i.estado_item === 'listo');
        const algoEmpezado = items.some((i) => i.estado_item !== 'pendiente');

        return {
          sector,
          estado: todosListos
            ? ('listo' as const)
            : algoEmpezado
              ? ('en_preparacion' as const)
              : ('pendiente' as const),
          cantidadItems: items.length,
        };
      })
      .filter((parte): parte is ParteSector => parte !== null);
  }

  nombreSector(sector: SectorPedido): string {
    return sector === 'bar' ? 'Bar' : 'Cocina';
  }

  estadoParteLegible(estado: EstadoPedidoItem): string {
    switch (estado) {
      case 'listo':
        return 'Listo';
      case 'en_preparacion':
        return 'En preparación';
      default:
        return 'Sin empezar';
    }
  }

  /** Hace cuanto que espera que lo lleven, medido sobre updated_at. */
  minutosListo(pedido: PedidoVista): number {
    if (!pedido.actualizado_at) {
      return 0;
    }
    return Math.max(
      0,
      Math.floor((this.ahora() - new Date(pedido.actualizado_at).getTime()) / 60000),
    );
  }

  /** Si está listo hace rato, se enfría: hay que llevarlo ya. */
  esUrgente(pedido: PedidoVista): boolean {
    return this.minutosListo(pedido) >= 5;
  }

  iconoSector(sector: string): string {
    return sector === 'bar' ? 'beer-outline' : 'restaurant-outline';
  }

  async entregar(pedido: PedidoVista): Promise<void> {
    this.entregando.set(pedido.id);

    try {
      await this.pedidosService.marcarEntregado(pedido.id);
      await this.cargar();
      await this.mostrarToast(
        'Mesa ' + pedido.mesa_numero + ': pedido entregado.',
        'success',
      );
    } catch (e) {
      await this.mostrarToast(
        traducirErrorSupabase(e, 'No se pudo registrar la entrega.'),
        'danger',
      );
      this.vibrar();
    } finally {
      this.entregando.set(null);
    }
  }

  // ------------------------------------------------------------------ realtime

  private conectar(): void {
    this.canal ??= this.pedidosService.escucharCambios(
      'pedidos-listos-mozo',
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

  /** Avisa solo por los que recien quedaron completos. */
  private avisarCompletos(lista: PedidoVista[]): void {
    const listos = lista.filter((p) => p.estado === 'listo');
    const nuevos = listos.filter((p) => !this.idsListosConocidos.has(p.id));
    this.idsListosConocidos = new Set(listos.map((p) => p.id));

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
        ? 'Pedido completo de la mesa ' + mesas + '. Listo para entregar.'
        : 'Pedidos completos de las mesas ' + mesas + '.',
      'success',
    );
  }

  // ------------------------------------------------------------------ avisos

  private vibrar(): void {
    try {
      navigator.vibrate?.([200, 80, 200]);
    } catch {
      // Sin vibración el toast igual avisa.
    }
  }

  private async mostrarToast(
    message: string,
    color: 'success' | 'danger',
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color,
    });
    await toast.present();
  }
}
