import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  inject
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';
import { IonContent } from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';
import { JuegoService } from '../../../core/services/juego.service';
import { SonidoService } from '../../../core/services/sonido.service';
import {
  BANCO_PREGUNTAS,
  PreguntaTrivia
} from './data/trivia.preguntas';
@Component({
  selector: 'app-trivia',
  standalone: true,
  imports: [
    IonContent,
    RouterLink
  ],
  templateUrl: './trivia.page.html',
  styleUrl: './trivia.page.scss'
})
export class TriviaPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly juegoService = inject(JuegoService);
  private readonly sonidoService =
  inject(SonidoService);
  nivelActual = signal(1);
  readonly maximoNiveles = 3;
  private timer: ReturnType<typeof setInterval> | null = null;
  tiempoAgotado = false;
  readonly preguntasPorNivel = {
    1: 3,
    2: 4,
    3: 5
  };
  tiempoRestante = signal(10);
  preguntas = signal<PreguntaTrivia[]>([]);
  preguntaActual = signal(0);
  respuestaSeleccionada =
    signal<string | null>(null);
  respuestaCorrecta =
    signal<boolean | null>(null);
  mostrarInicio = signal(false);
  mostrarResultado = signal(false);
  resultadoVictoria = signal(false);
  mensajeResultado = signal('');
  partidaPorDescuento = false;
  descuentoRegistrado = 0;
  registrandoResultado = false;
  errorRegistro = false;
  async ngOnInit(): Promise<void> {
    this.partidaPorDescuento =
      this.route.snapshot.queryParamMap.get(
        'descuento'
      ) === 'true';
    if (this.partidaPorDescuento) {
      this.nivelActual.set(2);
    } else {
      this.nivelActual.set(1);
    }
    this.aciertos = 0;
    this.iniciarNivel();
  }
  get cantidadPreguntas(): number {
    return this.preguntasPorNivel[
      this.nivelActual() as 1 | 2 | 3
    ];
  }
  get pregunta(): PreguntaTrivia | null {
    return (
      this.preguntas()[
        this.preguntaActual()
      ] ?? null
    );
  }
  get numeroPregunta(): number {
    return this.preguntaActual() + 1;
  }
  get esUltimaPregunta(): boolean {
    return (
      this.preguntaActual() ===
      this.preguntas().length - 1
    );
  }
  get respuestasNecesarias(): number {
    return Math.ceil(
      this.cantidadPreguntas * 0.6
    );
  }
  iniciarNivel(): void {
    const nivel =
      this.nivelActual() as 1 | 2 | 3;
    const preguntasNivel = [...BANCO_PREGUNTAS[nivel]];
    this.preguntas.set(
      this.mezclarPreguntas(preguntasNivel)
        .slice(
          0,
          this.cantidadPreguntas
        )
    );
    this.preguntaActual.set(0);
    this.respuestaSeleccionada.set(null);
    this.respuestaCorrecta.set(null);
    this.mostrarResultado.set(false);
    this.errorRegistro = false;
    this.mostrarInicio.set(true);
  }

  comenzarPartida(): void {
    this.mostrarInicio.set(false);
    this.preguntaActual.set(0);
    this.respuestaSeleccionada.set(null);
    this.respuestaCorrecta.set(null);
    this.iniciarTimer();
  }

  seleccionarRespuesta(letra: string): void {
    if (
      this.respuestaSeleccionada() !== null ||
      this.mostrarResultado()
    ) {
      return;
    }
    const pregunta = this.pregunta;

    if (!pregunta) {
      return;
    }
    this.detenerTimer();
    this.respuestaSeleccionada.set(letra);
    const esCorrecta =
      letra === pregunta.respuestaCorrecta;

    this.respuestaCorrecta.set(esCorrecta);

    if (esCorrecta) {
      this.aciertos++;
      this.sonidoService.reproducir('correcta');
    } else {
      this.sonidoService.reproducir('incorrecta');
    }
  }

  async continuarPregunta(): Promise<void> {
    if (this.esUltimaPregunta) {
      await this.finalizarNivel();
      return;
    }
    this.preguntaActual.update(
      indice => indice + 1
    );
    this.respuestaSeleccionada.set(null);
    this.respuestaCorrecta.set(null);
    this.iniciarTimer();
  }
  private async finalizarNivel(): Promise<void> {
    this.detenerTimer();

    const respuestasCorrectas =
      this.contarRespuestasCorrectas();

    const necesarias =
      Math.ceil(
        this.preguntas().length * 0.6
      );

    const gano =
      respuestasCorrectas >= necesarias;

    this.resultadoVictoria.set(gano);

    if (this.partidaPorDescuento) {
      this.sonidoService.reproducir(
        gano ? 'victoria' : 'derrota'
      );

      await this.registrarResultado(gano);
      return;
    }

    if (gano) {
      this.sonidoService.reproducir('victoria');

      if (
        this.nivelActual() <
        this.maximoNiveles
      ) {
        this.mensajeResultado.set(
          `¡Completaste el nivel ${this.nivelActual()}! ` +
          `Acertaste ${respuestasCorrectas} de ` +
          `${this.preguntas().length} preguntas.`
        );
      } else {
        this.mensajeResultado.set(
          `¡Completaste los 3 niveles de Trivia! ` +
          `Acertaste ${respuestasCorrectas} de ` +
          `${this.preguntas().length} preguntas.`
        );
      }
    } else {
      this.mensajeResultado.set(
        `Acertaste ${respuestasCorrectas} de ` +
        `${this.preguntas().length} preguntas. ` +
        `Necesitabas al menos ${necesarias} respuestas correctas.`
      );

      this.sonidoService.reproducir('derrota');
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
        usuario.roles?.nombre !==
        'cliente_registrado'
      ) {
        throw new Error(
          'El descuento solo está disponible para clientes registrados.'
        );
      }
      const resultado =
        await this.juegoService.registrarResultado(
          usuario.id,
          'trivia',
          gano
        );
      this.descuentoRegistrado =
        resultado.descuento;
      if (gano) {
        this.mensajeResultado.set(
          `¡Ganaste un ${resultado.descuento}% ` +
          `de descuento!`
        );
      } else {
        this.mensajeResultado.set(
          'Esta vez no obtuviste el descuento. ' +
          '¡Gracias por jugar!'
        );
      }
      this.mostrarResultado.set(true);
    } catch (error) {
      console.error(
        'Error al registrar resultado de Trivia:',
        error
      );
      this.errorRegistro = true;
      this.mensajeResultado.set(
        'No se pudo registrar el resultado del juego. ' +
        'Intentá nuevamente.'
      );
      this.mostrarResultado.set(true);
    } finally {
      this.registrandoResultado = false;
    }
  }
  private contarRespuestasCorrectas(): number {
    return this.aciertos;
  }
  private aciertos = 0;
  continuarNivel(): void {
    if (this.partidaPorDescuento) {
      this.router.navigate([
        '/juegos'
      ]);
      return;
    }
    this.mostrarResultado.set(false);
    if (this.resultadoVictoria()) {
      if (
        this.nivelActual() <
        this.maximoNiveles
      ) {
        this.nivelActual.update(
          nivel => nivel + 1
        );
        this.aciertos = 0;
        this.iniciarNivel();
        return;
      }
      this.aciertos = 0;
      this.iniciarNivel();
      return;
    }
    this.aciertos = 0;
    this.iniciarNivel();
  }
  reiniciarDesdeNivel1(): void {
    if (this.partidaPorDescuento) {
      this.router.navigate([
        '/juegos'
      ]);
      return;
    }
    this.nivelActual.set(1);
    this.aciertos = 0;
    this.mostrarResultado.set(false);
    this.iniciarNivel();
  }
  private mezclarPreguntas(
    preguntas: PreguntaTrivia[]
  ): PreguntaTrivia[] {
    return preguntas
      .map(pregunta => ({
        pregunta,
        orden: Math.random()
      }))
      .sort(
        (a, b) =>
          a.orden - b.orden
      )
      .map(
        item => item.pregunta
      );
  }
  volverAJuegos(): void {
    this.mostrarResultado.set(false);
    window.history.back();
  }

  iniciarTimer(): void {
    this.detenerTimer();

    this.tiempoRestante.set(10);
    this.tiempoAgotado = false;

    this.timer = setInterval(() => {
      const tiempo = this.tiempoRestante();

      if (tiempo <= 1) {
        this.tiempoRestante.set(0);
        this.detenerTimer();
        this.tiempoAgotado = true;
        this.finalizarPorTiempo();
        return;
      }

      this.tiempoRestante.set(tiempo - 1);
    }, 1000);
  }

  detenerTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private finalizarPorTiempo(): void {
    if (
      this.respuestaSeleccionada() !== null ||
      this.mostrarResultado() ||
      this.mostrarInicio()
    ) {
      return;
    }

    this.respuestaCorrecta.set(false);
    this.respuestaSeleccionada.set('__TIEMPO_AGOTADO__');
    this.sonidoService.reproducir('incorrecta');
  }

  ngOnDestroy(): void {
    this.detenerTimer();
  }
}
