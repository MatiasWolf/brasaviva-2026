import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule, TitleCasePipe, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { CuentaService } from '../../core/services/cuenta.service';
import { MensajeModalService } from '../../core/services/mensaje-modal.service';
import { QrScannerComponent } from '../../shared/components/qr-scanner/qr-scanner.component';
import { SpinnerLogoComponent } from '../../shared/components/spinner-logo/spinner-logo.component';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonFooter
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  cardOutline, 
  qrCodeOutline, 
  arrowBackOutline, 
  checkmarkCircleOutline, 
  receiptOutline 
} from 'ionicons/icons';
import { EstadiaRealtimeService } from '../../core/services/estadia-realtime.service';
import { ClienteService } from '../../core/services/cliente.service';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-solicitar-cuenta',
  templateUrl: './solicitar-cuenta.page.html',
  styleUrls: ['./solicitar-cuenta.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    QrScannerComponent,
    SpinnerLogoComponent
  ]
})
export class SolicitarCuentaPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  public readonly cuentaService = inject(CuentaService);
  private readonly modalService = inject(MensajeModalService);
  private readonly estadiaRealtime = inject(EstadiaRealtimeService);
  private readonly clienteService = inject(ClienteService);
  private readonly authService = inject(AuthService);
  private readonly supabaseService = inject(SupabaseService);

  // Control de fase operativa en caliente mediante Signals
  public readonly faseActual = signal<'confirmacion_inicial' | 'bloqueo_propina' | 'detalle_factura' | 'espera_mozo'>('confirmacion_inicial');
  public readonly mostrandoScanner = signal<boolean>(false);
  public readonly procesandoTransaccion = signal<boolean>(false);

  private canalPagosRealtime: ReturnType<typeof this.supabaseService.client.channel> | null = null;

  constructor() {
    addIcons({
      cardOutline,
      qrCodeOutline,
      arrowBackOutline,
      checkmarkCircleOutline,
      receiptOutline
    });
  }

  async ngOnInit(): Promise<void> {
    this.procesandoTransaccion.set(true);
    
    // 1. Recuperar de forma autónoma la estadía activa en el salón
    const ocupacionId = await this.cuentaService.obtenerOcupacionActivaLocal();
    
    if (!ocupacionId) {
      this.procesandoTransaccion.set(false);
      this.modalService.error('No pudimos detectar una estadía activa en una mesa para tu usuario.', 'Error de asignación');
      await this.volverAlHome();
      return;
    }

    // 2. Cargar en paralelo los consumos entregados y los beneficios por juegos ganados
    const [tieneConsumos] = await Promise.all([
      this.cuentaService.cargarConsumosEntregados(),
      this.cuentaService.verificarDescuentoJuegos()
    ]);

    this.procesandoTransaccion.set(false);

    if (!tieneConsumos) {
      this.modalService.error('No se registran consumos entregados en la mesa para poder facturar.', 'Sin consumos');
      await this.volverAlHome();
    }
  }

  /**
   * El cliente confirma la intención de solicitar la facturación.
   * Punto de no retorno del flujo de UX.
   */
  public avanzarABloqueoPropina(): void {
    this.faseActual.set('bloqueo_propina');
  }

  /**
   * Activa la cámara levantando el componente reutilizable de QR.
   */
  public abrirLectorPropina(): void {
    this.mostrandoScanner.set(true);
  }

  /**
   * Cancela la captura de la cámara volviendo al estado de bloqueo.
   */
  public cerrarLectorPropina(): void {
    this.mostrandoScanner.set(false);
  }

  /**
   * Recibe el string del escáner y procesa el porcentaje correspondiente.
   */
  public onPropinaEscaneada(texto: string): void {
    this.mostrandoScanner.set(false);
    
    const porcentaje = this.cuentaService.evaluarQrPropina(texto);

    if (porcentaje === -1) {
      // El servicio modal gatilla por debajo la vibración de hardware y el audio de error
      this.modalService.error('El código QR escaneado no coincide con ningún indicador de propina válido del restaurante.', 'Código inválido');
      return;
    }

    // Asignar el porcentaje validado y transicionar a la pantalla estilo Mercado Pago
    this.cuentaService.propinaPorcentaje.set(porcentaje);
    this.faseActual.set('detalle_factura');
  }

  /**
   * Envía el pago simulado inicializando las transacciones en Supabase.
   */
  async ejecutarPago(): Promise<void> {
    this.procesandoTransaccion.set(true);
    
    const exito = await this.cuentaService.registrarSolicitudPago();
    
    this.procesandoTransaccion.set(false);

    if (exito) {
      this.faseActual.set('espera_mozo');
      // Invocar el método de escucha reactiva
      this.iniciarEscuchaConfirmacionPago();
    } else {
      this.modalService.error('Hubo un problema al registrar tu solicitud de pago. Por favor, intenta de nuevo.', 'Error de red');
    }
  }

  /**
   * Redirección hacia la pantalla principal de la aplicación.
   */
  async volverAlHome(): Promise<void> {
    await this.router.navigate(['/home'], { replaceUrl: true });
  }

    /**
   * Inicializa la escucha en segundo plano sobre la transacción de cobro.
   */
  private iniciarEscuchaConfirmacionPago(): void {
    const mesaOcupacionId = this.cuentaService.ocupacionMesaId;
    if (!mesaOcupacionId) return;

    // Guardr la referencia en la propiedad de la clase
    this.canalPagosRealtime = this.supabaseService.client
      .channel(`espera-pago-${mesaOcupacionId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'pagos', 
          filter: `ocupacion_id=eq.${mesaOcupacionId}` 
        },
        async (payload: any) => {
          if (payload.new.estado === 'confirmado') {
            await this.detenerSuscripcionYRedirigir();
          }
        }
      )
      .subscribe();
  }

  /**
   * Apaga el canal activo de Supabase.
   */
  private desuscribirCanalPago(): void {
    if (this.canalPagosRealtime) {
      this.supabaseService.client.removeChannel(this.canalPagosRealtime);
      this.canalPagosRealtime = null;
    }
  }

  /**
   * Cierra el canal, dispara el feedback de éxito y redirige al cliente al Home.
   */
  private async detenerSuscripcionYRedirigir(): Promise<void> {
    this.desuscribirCanalPago();
    
    this.modalService.exito(
      '¡Muchas gracias por visitarnos en Brasa Viva! Tu pago fue confirmado con éxito.',
      '¡Gracias por venir!'
    );
    await this.volverAlHome();
  }

  ngOnDestroy(): void {
    this.desuscribirCanalPago();
  }
}