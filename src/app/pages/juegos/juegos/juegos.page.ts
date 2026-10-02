import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import {
  JuegoService,
  JuegoInfo,
} from '../../../core/services/juego.service';
import { AuthService } from '../../../core/services/auth.service';
import { AnonymousSessionService } from '../../../core/services/anonymous-session.service';
@Component({
  selector: 'app-juegos',
  standalone: true,
  imports: [
    IonContent,
  ],
  templateUrl: './juegos.page.html',
  styleUrl: './juegos.page.scss',
})
export class JuegosPage implements OnInit {
  private readonly router = inject(Router);
  private readonly juegoService = inject(JuegoService);
  private readonly authService = inject(AuthService);
  private readonly anonymousSessionService = inject(AnonymousSessionService);
  juegos = signal<JuegoInfo[]>([]);
  esClienteRegistrado = signal(false);
  oportunidadDisponible = signal(false);
  ocupacionMesaId = signal<number | null>(null);
  mostrarModalDescuento = signal(false);
  cargando = signal(true);
  async ngOnInit(): Promise<void> {
    this.juegos.set(this.juegoService.obtenerJuegos());
    await this.cargarEstado(true);
  }
  async ionViewWillEnter(): Promise<void> {
    await this.cargarEstado(false);
  }
  private async cargarEstado(mostrarCarga = false): Promise<void> {
    if (mostrarCarga) {
      this.cargando.set(true);
    }
    try {
      const usuario = await this.authService.cargarUsuarioActual();
      if (usuario?.roles?.nombre === 'cliente_registrado') {
        this.esClienteRegistrado.set(true);
        const estado =
          await this.juegoService.obtenerEstadoOportunidad(usuario.id);
        this.oportunidadDisponible.set(estado.disponible);
        this.ocupacionMesaId.set(estado.ocupacionMesaId);
        if (estado.disponible && estado.ocupacionMesaId) {
          this.mostrarModalSiCorresponde(
            usuario.id,
            estado.ocupacionMesaId
          );
        } else {
          this.mostrarModalDescuento.set(false);
        }
        return;
      }
      const sesionAnonima =
        await this.anonymousSessionService.obtenerSesion();
      if (sesionAnonima) {
        this.esClienteRegistrado.set(false);
        this.oportunidadDisponible.set(false);
        this.ocupacionMesaId.set(null);
        this.mostrarModalDescuento.set(false);
      }
    } catch (error) {
      console.error('Error al cargar JuegosPage:', error);
      this.esClienteRegistrado.set(false);
      this.oportunidadDisponible.set(false);
      this.ocupacionMesaId.set(null);
      this.mostrarModalDescuento.set(false);
    } finally {
      if (mostrarCarga) {
        this.cargando.set(false);
      }
    }
  }
  private mostrarModalSiCorresponde(usuarioId: string, ocupacionMesaId: number): void {
    const clave = `brasa_juegos_modal_${usuarioId}_${ocupacionMesaId}`;
    const yaMostrado = sessionStorage.getItem(clave);
    if (yaMostrado) {
      return;
    }
    sessionStorage.setItem(clave, 'true');
    this.mostrarModalDescuento.set(true);
  }
  cerrarModal(): void {
    this.mostrarModalDescuento.set(false);
  }
  jugar(juego: JuegoInfo): void {
    const porDescuento = this.esClienteRegistrado() && this.oportunidadDisponible();
    const ruta = `/juegos/${juego.juego}`;
    if (porDescuento) {
      this.router.navigate([ruta], {
        queryParams: {
          descuento: 'true',
        },
      });
      return;
    }
    this.router.navigate([ruta]);
  }
  volver(): void {
    this.router.navigate(['/home']);
  }
}
