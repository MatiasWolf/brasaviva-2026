import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CuentaService } from '../../core/services/cuenta.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { MensajeModalService } from '../../core/services/mensaje-modal.service';
import { SpinnerLogoComponent } from '../../shared/components/spinner-logo/spinner-logo.component';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonFooter
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, 
  checkmarkCircleOutline, 
  cashOutline,
  receiptOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-listado-pagos',
  templateUrl: './listado-pagos.page.html',
  styleUrls: ['./listado-pagos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon,
    IonFooter,
    SpinnerLogoComponent
  ]
})
export class ListadoPagosPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly cuentaService = inject(CuentaService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly modalService = inject(MensajeModalService);

  // States controlados mediante Signals de Angular
  public readonly pagosPendientes = signal<any[]>([]);
  public readonly cargandoInicial = signal<boolean>(true);
  public readonly procesandoLiberacion = signal<boolean>(false);

  // Canal Realtime para la escucha de modificaciones en la base de datos
  private pagosRealtimeChannel: any = null;

  constructor() {
    addIcons({
      arrowBackOutline,
      checkmarkCircleOutline,
      cashOutline,
      receiptOutline
    });
  }

  async ngOnInit(): Promise<void> {
    // 1. Cargar el listado inicial de transacciones pendientes en el salón
    await this.cargarPagosPendientes();
    this.cargandoInicial.set(false);

    // 2. Encender la escucha activa en tiempo real sobre la tabla de pagos
    this.inicializarEscuchaRealtime();
  }

  ngOnDestroy(): void {
    // Apagar el canal de escucha para prevenir fugas de memoria al salir de la pantalla
    this.desconectarseCanalRealtime();
  }

  /**
   * Consulta al servicio la lista actualizada de cobros pendientes de confirmación.
   */
  private async cargarPagosPendientes(): Promise<void> {
    const datos = await this.cuentaService.obtenerPagosPendientesMozo();
    this.pagosPendientes.set(datos);
  }

  /**
   * Configura e inicia el canal de eventos Postgres para reaccionar ante cambios en caliente.
   */
  private inicializarEscuchaRealtime(): void {
    if (this.pagosRealtimeChannel) {
      this.supabaseService.client.removeChannel(this.pagosRealtimeChannel);
    }

    this.pagosRealtimeChannel = this.supabaseService.client
      .channel('gestion-pagos-realtime-mozo')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pagos' },
        async () => {
          // Sincronizar de forma automática las tarjetas ante cualquier inserción o cambio
          await this.cargarPagosPendientes();
        }
      )
      .subscribe();
  }

  /**
   * Remueve de forma limpia el canal Realtime del cliente de Supabase.
   */
  private desconectarseCanalRealtime(): void {
    if (this.pagosRealtimeChannel) {
      this.supabaseService.client.removeChannel(this.pagosRealtimeChannel);
      this.pagosRealtimeChannel = null;
    }
  }

  /**
   * Ejecuta la liberación de la mesa y el comensal mapeando los datos de la tarjeta.
   */
  async confirmarPagoMesa(pago: any): Promise<void> {
    this.procesandoLiberacion.set(true);

    const params = {
      pagoId: pago.id,
      ocupacionId: pago.ocupacion_id,
      mesaId: pago.ocupaciones_mesa?.mesa_id,
      usuarioId: pago.ocupaciones_mesa?.usuario_id || null,
      sesionAnonimaId: pago.ocupaciones_mesa?.sesion_anonima_id || null
    };

    // Validación preventiva de parámetros de hardware de red
    if (!params.mesaId || !params.ocupacionId) {
      this.procesandoLiberacion.set(false);
      this.modalService.error('Faltan identificadores clave de la mesa u ocupación para proceder.', 'Error de datos');
      return;
    }

    // Ejecución de la transacción unificada en el servicio (con el nombre original solicitado)
    const exito = await this.cuentaService.confirmarPagoYLiberarMesa({
      pagoId: params.pagoId, 
      ocupacionId: params.ocupacionId,
      mesaId: params.mesaId,
      usuarioId: params.usuarioId,
      sesionAnonimaId: params.sesionAnonimaId
    });

    this.procesandoLiberacion.set(false);

    if (exito) {
      // El servicio modal gatilla por debajo el audio de éxito nativo de tus compañeros
      this.modalService.exito(
        `La Mesa ${pago.ocupaciones_mesa?.mesas?.numero || ''} ha sido liberada correctamente y está disponible de nuevo en el salón.`,
        'Mesa Liberada'
      );
      // Refrescar local preventivo (aunque el canal realtime ya gatilla la actualización)
      await this.cargarPagosPendientes();
    } else {
      this.modalService.error('No se pudo completar la liberación de la mesa en el servidor.', 'Error de transacción');
    }
  }

  /**
   * Redirección segura para retornar al panel principal del empleado.
   */
  async volverAlHome(): Promise<void> {
    await this.router.navigate(['/home'], { replaceUrl: true });
  }
}