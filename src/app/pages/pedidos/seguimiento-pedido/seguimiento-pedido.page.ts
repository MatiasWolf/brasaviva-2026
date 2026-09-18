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
  ViewDidLeave,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  beerOutline,
  calendarOutline,
  checkmarkCircle,
  checkmarkDoneOutline,
  closeCircle,
  ellipseOutline,
  hourglassOutline,
  receiptOutline,
  restaurantOutline,
} from 'ionicons/icons';

import { PedidosSectorService } from '../../../core/services/pedidos-sector.service';
import { PedidoService } from '../../../core/services/pedido.service';
import {
  EstadoPedido,
  PedidoVista,
  SectorPedido,
} from '../../../core/models/pedido.models';
import { SpinnerLogoComponent } from '../../../shared/components/spinner-logo/spinner-logo.component';
import { traducirErrorSupabase } from '../../../core/utils/traducir-error.util';

/** Un paso del recorrido del pedido, tal como lo ve el cliente. */
interface PasoSeguimiento {
  estado: EstadoPedido;
  titulo: string;
  detalle: string;
  alcanzado: boolean;
  actual: boolean;
}

/** El orden en que avanza un pedido. "rechazado" corta el camino. */
const RECORRIDO: { estado: EstadoPedido; titulo: string; detalle: string }[] = [
  {
    estado: 'pendiente',
    titulo: 'Pedido enviado',
    detalle: 'El mozo lo está por revisar.',
  },
  {
    estado: 'confirmado',
    titulo: 'Confirmado por el mozo',
    detalle: 'Ya salió para la cocina y el bar.',
  },
  {
    estado: 'en_preparacion',
    titulo: 'En preparación',
    detalle: 'Lo están preparando en este momento.',
  },
  {
    estado: 'listo',
    titulo: 'Listo',
    detalle: 'El mozo lo está por llevar a tu mesa.',
  },
  {
    estado: 'entregado',
    titulo: 'Entregado',
    detalle: 'Que lo disfrutes.',
  },
];

/**
 * Estado del pedido, del lado del cliente.
 * Los puntos 16, 17 y 18 terminan con "el cliente verifica el cambio de estado
 * en su pedido": esta es esa pantalla. Es de solo lectura y se actualiza por
 * realtime mientras cocina y bar trabajan.
 */
@Component({
  selector: 'app-seguimiento-pedido',
  templateUrl: './seguimiento-pedido.page.html',
  styleUrls: ['./seguimiento-pedido.page.scss'],
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
export class SeguimientoPedidoPage implements ViewWillEnter, ViewDidLeave {
  private readonly pedidosService = inject(PedidosSectorService);
  private readonly pedidoService = inject(PedidoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pedidos = signal<PedidoVista[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  private canal: RealtimeChannel | null = null;
  private ocupacionId: number | null = null;

  /** Lo que todavía no se entregó es lo que al cliente le interesa mirar. */
  readonly enCurso = computed(() =>
    this.pedidos().filter((p) => p.estado !== 'entregado' && p.estado !== 'rechazado'),
  );

  readonly entregados = computed(() =>
    this.pedidos().filter((p) => p.estado === 'entregado'),
  );

  readonly rechazados = computed(() =>
    this.pedidos().filter((p) => p.estado === 'rechazado'),
  );

  readonly hayPedidos = computed(() => this.pedidos().length > 0);

  constructor() {
    addIcons({
      'receipt-outline': receiptOutline,
      'calendar-outline': calendarOutline,
      'hourglass-outline': hourglassOutline,
      'checkmark-circle': checkmarkCircle,
      'checkmark-done-outline': checkmarkDoneOutline,
      'close-circle': closeCircle,
      'ellipse-outline': ellipseOutline,
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
      // Con 0 se fuerza la busqueda por la sesion del cliente.
      this.ocupacionId ??= (await this.pedidoService.ocupacionActiva(0)).id;

      const lista = await this.pedidosService.listarPorOcupacion(this.ocupacionId);
      this.pedidos.set(lista);
    } catch (e) {
      this.error.set(
        traducirErrorSupabase(
          e,
          'No pudimos traer el estado de tu pedido. Revisá la conexión.',
        ),
      );
      this.vibrar();
    } finally {
      this.cargando.set(false);
    }
  }

  /** El recorrido del pedido con el paso actual marcado. */
  pasos(pedido: PedidoVista): PasoSeguimiento[] {
    const actual = RECORRIDO.findIndex((p) => p.estado === pedido.estado);

    return RECORRIDO.map((paso, indice) => ({
      ...paso,
      alcanzado: actual >= 0 && indice <= actual,
      actual: indice === actual,
    }));
  }

  /** Cómo viene cada sector, para que el cliente sepa qué falta. */
  faltaSector(pedido: PedidoVista, sector: SectorPedido): boolean {
    const items = pedido.items.filter((i) => i.sector === sector);
    return items.length > 0 && items.some((i) => i.estado_item !== 'listo');
  }

  tieneSector(pedido: PedidoVista, sector: SectorPedido): boolean {
    return pedido.items.some((i) => i.sector === sector);
  }

  iconoSector(sector: string): string {
    return sector === 'bar' ? 'beer-outline' : 'restaurant-outline';
  }

  // ------------------------------------------------------------------ realtime

  private conectar(): void {
    this.canal ??= this.pedidosService.escucharCambios(
      'seguimiento-pedido-cliente',
      () => void this.cargar(),
    );
  }

  private desconectar(): void {
    void this.pedidosService.cerrarCanal(this.canal);
    this.canal = null;
  }

  private vibrar(): void {
    try {
      navigator.vibrate?.([180, 80, 180]);
    } catch {
      // Si el dispositivo no vibra, el mensaje en pantalla igual avisa.
    }
  }
}
