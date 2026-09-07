
import { Component, computed, inject, signal } from '@angular/core';
import { ListaEsperaService } from '../../../core/services/lista-espera.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AnonymousSessionService } from '../../../core/services/anonymous-session.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  accessibility,
  addOutline,
  checkmarkCircle,
  logOutOutline,
  checkmarkCircleOutline,
  removeOutline,
  restaurantOutline,
  starOutline,
} from 'ionicons/icons';

type TipoMesa = 'estandar' | 'vip' | 'movilidad_reducida';

@Component({
  selector: 'app-lista-espera',
  templateUrl: './ingreso-lista-espera.page.html',
  styleUrls: ['./ingreso-lista-espera.page.scss'],
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon,
  ],
})
export class IngresoListaEsperaPage {
  private listaEsperaService = inject(ListaEsperaService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private anonymousSession = inject(AnonymousSessionService);
  private supabase = inject(SupabaseService);
  readonly cantidadComensales = signal(1);
  readonly tipoMesa = signal<TipoMesa | null>(null);
  readonly maxComensales = signal(0);

  mensajeError = signal('');

  readonly puedeConfirmar = computed(() =>
    this.cantidadComensales() >= 1 &&
    this.tipoMesa() !== null &&
    this.maxComensales() > 0
  );

  constructor() {
    addIcons({
      accessibility,
      addOutline,
      checkmarkCircle,
      logOutOutline,
      checkmarkCircleOutline,
      removeOutline,
      restaurantOutline,
      starOutline,
    });
  }

  incrementarComensales(): void {
    if (this.cantidadComensales() >= this.maxComensales()) {
      if (this.maxComensales() > 0) {
        this.mensajeError.set(
          `La cantidad máxima permitida es de ${this.maxComensales()} comensales.`
        );
      }
      return;
    }

    this.mensajeError.set('');
    this.cantidadComensales.update(cantidad => cantidad + 1);
  }

  decrementarComensales(): void {
    this.mensajeError.set('');
    this.cantidadComensales.update(cantidad =>
      Math.max(1, cantidad - 1)
    );
  }

  async seleccionarMesa(tipo: TipoMesa): Promise<void> {
    // Cada vez que cambia el tipo de mesa,
    // la cantidad vuelve a empezar desde 1.
    this.cantidadComensales.set(1);
    this.tipoMesa.set(tipo);
    await this.obtenerMaxComensales(tipo);
  }

  async obtenerMaxComensales(tipo: TipoMesa): Promise<void> {
    this.mensajeError.set('');

    const { data, error } = await this.supabase.client
      .from('mesas')
      .select('comensales')
      .eq('tipo', tipo);

    if (error) {
      console.error('Error al consultar capacidad de mesas:', error);
      this.maxComensales.set(0);
      this.mensajeError.set('No se pudo consultar la disponibilidad de mesas.');
      return;
    }

    if (!data || data.length === 0) {
      this.maxComensales.set(0);
      this.mensajeError.set(
        'No hay mesas configuradas para este tipo de mesa.'
      );
      return;
    }

    const maximo = Math.max(...data.map(mesa => mesa.comensales));
    this.maxComensales.set(maximo);
  }

  async confirmarIngreso(): Promise<void> {
    if (!this.puedeConfirmar()) {
      return;
    }

    try {
      await this.listaEsperaService.agregarCliente(
        this.cantidadComensales(),
        this.tipoMesa()!
      );

      if (this.anonymousSession.obtenerIdSesion()) {
        await this.anonymousSession.actualizarEstado(
          'en_espera'
        );

      } else if (this.auth.usuarioActual) {
        await this.auth.actualizarEstadoEstadia(
          'en_espera'
        );
      }

      await this.router.navigate(['/home'], {
        replaceUrl: true
      });

    } catch (error) {
      console.error(
        'No se pudo confirmar el ingreso a la lista de espera:',
        error
      );
    }
  }

    
  async cerrarSesion(): Promise<void> {
    if (this.anonymousSession.obtenerIdSesion()) {
      await this.anonymousSession.cerrarSesion();
    } else {
      await this.auth.logout();
    }

    await this.router.navigate(['/login'], {
      replaceUrl: true
    });
  }
}

