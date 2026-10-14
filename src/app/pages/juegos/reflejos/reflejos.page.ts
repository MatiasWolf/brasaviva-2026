import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';
import { JuegoService } from '../../../core/services/juego.service';
import { SonidoService } from '../../../core/services/sonido.service';
@Component({
  selector: 'app-reflejos',
  standalone: true,
  imports: [
    IonContent,
    RouterLink
  ],
  templateUrl: './reflejos.page.html',
  styleUrl: './reflejos.page.scss'
})
export class ReflejosPage implements OnInit, OnDestroy {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private juegoService: JuegoService,
    private sonidoService: SonidoService
  ) {}
  nivelActual = signal(1);
  readonly maximoNiveles = 3;
  readonly toquesNecesarios = 4;
  partidaPorDescuento = false;
  descuentoRegistrado = false;
  descuentoObtenido = 0;
  registrandoResultado = false;
  errorRegistro = false;
  estado = signal<'esperando' | 'listo' | 'resultado'>(
    'esperando'
  );
  mensaje = signal('Esperá la señal...');
  tiempo = signal<number | null>(null);
  toques = signal(0);
  posicionX = signal(50);
  posicionY = signal(50);
  mostrarInicio = signal(false);
  mostrarResultado = signal(false);
  resultadoVictoria = signal(false);
  mensajeResultado = signal('');
  private timeoutId?: ReturnType<typeof setTimeout>;
  private feedbackTimeoutId?: ReturnType<typeof setTimeout>;
  private inicio = 0;
  private partidaIniciada = false;
  get tiempoMaximo(): number {
    return this.nivelActual() === 1
      ? 800
      : this.nivelActual() === 2
        ? 700
        : 600;
  }
  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.partidaPorDescuento =
        params.get('descuento') === 'true';
      if (this.partidaPorDescuento) {
        this.nivelActual.set(2);
      } else {
        this.nivelActual.set(1);
      }
      this.iniciarNivel();
    });
  }
  iniciarNivel(): void {
    this.limpiarTimeouts();
    this.partidaIniciada = false;
    this.estado.set('esperando');
    this.mensaje.set('Esperá la señal...');
    this.tiempo.set(null);
    this.toques.set(0);
    this.mostrarInicio.set(true);
    this.mostrarResultado.set(false);
    this.errorRegistro = false;
    this.registrandoResultado = false;
    this.generarPosicion();
  }
  comenzarPartida(): void {
    this.mostrarInicio.set(false);
    this.iniciarToque();
  }
  private iniciarToque(): void {
    this.limpiarTimeouts();
    this.partidaIniciada = false;
    this.estado.set('esperando');
    this.mensaje.set('Esperá la señal...');
    this.tiempo.set(null);
    this.generarPosicion();
    const demora =
      Math.floor(Math.random() * 1500) + 1500;
    this.timeoutId = setTimeout(() => {
      this.partidaIniciada = true;
      this.estado.set('listo');
      this.mensaje.set(
        '¡TOCÁ EL OBJETIVO!'
      );
      this.generarPosicion();
      this.inicio = performance.now();
      this.timeoutId = undefined;
    }, demora);
  }
  private generarPosicion(): void {
    const x =
      Math.floor(Math.random() * 70) + 15;
    const y =
      Math.floor(Math.random() * 45) + 40;
    this.posicionX.set(x);
    this.posicionY.set(y);
  }
  async tocarObjetivo(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    if (
      !this.partidaIniciada ||
      this.estado() !== 'listo'
    ) {
      return;
    }
    this.partidaIniciada = false;
    this.estado.set('resultado');
    const resultado =
      Math.round(
        performance.now() - this.inicio
      );
    this.tiempo.set(resultado);
    this.limpiarTimeouts();
    if (resultado >= this.tiempoMaximo) {
      this.resultadoVictoria.set(false);
      this.sonidoService.reproducir('derrota');
      if (this.partidaPorDescuento) {
        await this.registrarResultado(false);
        return;
      }
      this.mensajeResultado.set(
        `Tardaste ${resultado} ms. El límite era de ${this.tiempoMaximo} ms.`
      );
      this.mostrarResultado.set(true);
      return;
    }
    this.toques.update(
      valor => valor + 1
    );
    if (this.toques() < this.toquesNecesarios) {
      this.mensaje.set(
        `⚡ ${resultado} ms`
      );
      this.feedbackTimeoutId =
        setTimeout(() => {
          this.feedbackTimeoutId = undefined;
          if (!this.mostrarResultado()) {
            this.iniciarToque();
          }
        }, 700);
      return;
    }
    await this.mostrarVictoria();
  }
  private async mostrarVictoria(): Promise<void> {
    this.resultadoVictoria.set(true);
    this.sonidoService.reproducir('victoria');

    if (this.partidaPorDescuento) {
      await this.registrarResultado(true);
      return;
    }

    if (this.nivelActual() < this.maximoNiveles) {
      this.mensajeResultado.set(
        `¡Completaste el nivel ${this.nivelActual()}! Ahora podés pasar al nivel ${this.nivelActual() + 1}.`
      );
    } else {
      this.mensajeResultado.set(
        '¡Completaste los 3 niveles de reflejos!'
      );
    }

    this.mostrarResultado.set(true);
  }
  private async registrarResultado(
    gano: boolean
  ): Promise<void> {
    if (this.registrandoResultado) {
      return;
    }
    this.registrandoResultado = true;
    this.errorRegistro = false;
    try {
      const usuario =
        await this.authService.cargarUsuarioActual();
      if (
        !usuario ||
        usuario.roles?.nombre !== 'cliente_registrado'
      ) {
        throw new Error(
          'No hay un cliente registrado válido.'
        );
      }
      const resultado =
        await this.juegoService.registrarResultado(
          usuario.id,
          'reflejos',
          gano
        );
      this.descuentoRegistrado = true;
      this.descuentoObtenido =
        resultado.descuento;
      if (gano) {
        this.mensajeResultado.set(
          `¡Ganaste! Obtuviste un descuento del ${resultado.descuento}% para tu estadía.`
        );
      } else {
        this.mensajeResultado.set(
          'Tardaste demasiado. Esta vez no obtuviste descuento.'
        );
      }
      this.mostrarResultado.set(true);
    } catch (error) {
      console.error(
        'Error al registrar el resultado del juego:',
        error
      );
      this.errorRegistro = true;
      this.resultadoVictoria.set(false);
      this.mensajeResultado.set(
        'No se pudo registrar el resultado del juego.'
      );
      this.mostrarResultado.set(true);
    } finally {
      this.registrandoResultado = false;
    }
  }
  continuarNivel(): void {
    if (this.partidaPorDescuento) {
      this.volverAJuegos();
      return;
    }
    this.mostrarResultado.set(false);
    if (this.resultadoVictoria()) {
      if (
        this.nivelActual() < this.maximoNiveles
      ) {
        this.nivelActual.update(
          nivel => nivel + 1
        );
        this.iniciarNivel();
        return;
      }
      this.iniciarNivel();
      return;
    }
    this.iniciarNivel();
  }
  reiniciarDesdeNivel1(): void {
    if (this.partidaPorDescuento) {
      this.volverAJuegos();
      return;
    }
    this.nivelActual.set(1);
    this.mostrarResultado.set(false);
    this.iniciarNivel();
  }
  private limpiarTimeouts(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
    if (this.feedbackTimeoutId) {
      clearTimeout(
        this.feedbackTimeoutId
      );
      this.feedbackTimeoutId = undefined;
    }
  }
  volverAJuegos(): void {
    this.mostrarResultado.set(false);
    window.history.back();
  }
  ngOnDestroy(): void {
    this.limpiarTimeouts();
  }
}
