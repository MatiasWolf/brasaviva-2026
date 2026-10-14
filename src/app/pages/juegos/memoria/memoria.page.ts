import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  Router
} from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonBackButton,
  IonModal
} from '@ionic/angular';
import {
  AuthService
} from '../../../core/services/auth.service';
import {
  JuegoService
} from '../../../core/services/juego.service';
import { SonidoService } from '../../../core/services/sonido.service';
interface CartaMemoria {
  id: number;
  imagen: string;
  descubierta: boolean;
  encontrada: boolean;
}
@Component({
  selector: 'app-memoria',
  templateUrl: './memoria.page.html',
  styleUrls: ['./memoria.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonBackButton,
    IonModal
  ]
})
export class MemoriaPage implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private juegoService: JuegoService,
    private sonidoService: SonidoService
  ) {}
  cartas: CartaMemoria[] = [];
  cartasSeleccionadas: CartaMemoria[] = [];
  errores = 0;
  readonly maximosErrores = 4;
  bloqueado = false;
  juegoTerminado = false;
  nivelActual = 1;
  readonly maximoNiveles = 3;
  partidaPorDescuento = false;
  descuentoRegistrado = false;
  descuentoObtenido = 0;
  registrandoResultado = false;
  errorRegistro = false;
  get cantidadParejas(): number {
    return this.nivelActual + 3;
  }
  get cantidadCartas(): number {
    return this.cantidadParejas * 2;
  }
  mostrarInicio = false;
  mostrarResultado = false;
  resultadoVictoria = false;
  mensajeResultado = '';
  
  private readonly imagenes = [
    'assets/juegos/memoria/icecream.png',
    'assets/juegos/memoria/pizza.png',
    'assets/juegos/memoria/cake.png',
    'assets/juegos/memoria/taco.png',
    'assets/juegos/memoria/ensalada.png',
    'assets/juegos/memoria/sopa.png'
  ];
  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.partidaPorDescuento =
        params.get('descuento') === 'true';
      if (this.partidaPorDescuento) {
        this.nivelActual = 2;
      } else {
        this.nivelActual = 1;
      }
      this.iniciarJuego();
    });
  }
  iniciarJuego(): void {
    this.errores = 0;
    this.cartasSeleccionadas = [];
    this.bloqueado = false;
    this.juegoTerminado = false;
    this.mostrarResultado = false;
    this.errorRegistro = false;
    this.registrandoResultado = false;
    const cartas: CartaMemoria[] = [];
    const imagenesNivel =
      this.imagenes.slice(
        0,
        this.cantidadParejas
      );
    imagenesNivel.forEach(
      (imagen, indice) => {
        cartas.push({
          id: indice * 2,
          imagen,
          descubierta: false,
          encontrada: false
        });
        cartas.push({
          id: indice * 2 + 1,
          imagen,
          descubierta: false,
          encontrada: false
        });
      }
    );
    this.cartas =
      this.mezclarCartas(cartas);
    this.mostrarInicio = true;
  }
  comenzarPartida(): void {
    this
    .mostrarInicio = false;
  }
  seleccionarCarta(
    carta: CartaMemoria
  ): void {
    if (
      this.bloqueado ||
      carta.descubierta ||
      carta.encontrada ||
      this.cartasSeleccionadas.length >= 2 ||
      this.juegoTerminado
    ) {
      return;
    }
    carta.descubierta = true;
    this.cdr.detectChanges();
    this.cartasSeleccionadas.push(carta);
    if (
      this.cartasSeleccionadas.length === 2
    ) {
      this.compararCartas();
    }
  }
  private compararCartas(): void {
    const [
      primera,
      segunda
    ] = this.cartasSeleccionadas;
    this.bloqueado = true;
    if (
      primera.imagen === segunda.imagen
    ) {
      primera.encontrada = true;
      segunda.encontrada = true;
      primera.descubierta = true;
      segunda.descubierta = true;
      this.cartasSeleccionadas = [];
      this.bloqueado = false;
      this.verificarVictoria();
      return;
    }
    setTimeout(async () => {
      primera.descubierta = false;
      segunda.descubierta = false;
      this.cartasSeleccionadas = [];
      this.errores++;
      this.cdr.detectChanges();
      this.bloqueado = false;
      await this.verificarLimiteErrores();
    }, 900);
  }
  private async verificarVictoria(): Promise<void> {
    const todasEncontradas =
      this.cartas.every(
        carta => carta.encontrada
      );
    if (!todasEncontradas) {
      await this.verificarLimiteErrores();
      return;
    }
    this.juegoTerminado = true;
    this.resultadoVictoria = true;
    if (this.partidaPorDescuento) {
      await this.registrarResultado(true);
      return;
    }
    this.sonidoService.reproducir('victoria');
    if (
      this.nivelActual <
      this.maximoNiveles
    ) {
      this.mensajeResultado =
        `¡Completaste el nivel ${this.nivelActual}! ` +
        `Ahora comienza el nivel ${this.nivelActual + 1}.`;
    } else {
      this.mensajeResultado =
        '¡Completaste los 3 niveles de memoria!';
    }
    this.mostrarResultado = true;
    this.cdr.detectChanges();
  }
  private async verificarLimiteErrores(): Promise<void> {
    const todasEncontradas = this.cartas.every(
      carta => carta.encontrada
    );
    if (todasEncontradas) {
      return;
    }
    if (this.errores >= this.maximosErrores) {
      this.juegoTerminado = true;
      this.resultadoVictoria = false;
      this.sonidoService.reproducir('derrota');
      if (this.partidaPorDescuento) {
        await this.registrarResultado(false);
        return;
      }
      this.mensajeResultado =
        `Cometiste ${this.errores} errores. Llegaste al máximo permitido de ${this.maximosErrores}.`;
      this.mostrarResultado = true;
      this.cdr.detectChanges();
    }
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
        await this.authService
          .cargarUsuarioActual();
      if (
        !usuario ||
        usuario.roles?.nombre !==
          'cliente_registrado'
      ) {
        throw new Error(
          'No hay un cliente registrado válido.'
        );
      }
      const resultado =
        await this.juegoService.registrarResultado(
          usuario.id,
          'memoria',
          gano
        );
      this.descuentoRegistrado = true;
      this.descuentoObtenido =
        resultado.descuento;
      if (gano) {
        this.sonidoService.reproducir('victoria');
        this.mensajeResultado =
          `¡Ganaste! Obtuviste un descuento del ${resultado.descuento}% para tu estadía.`;
      }
      else {
        this.mensajeResultado =
          'No lograste completar el juego. Esta vez no obtuviste descuento.';
      }
      this.mostrarResultado = true;
      this.cdr.detectChanges();
    } catch (error) {
      console.error(
        'Error al registrar el resultado del juego:',
        error
      );
      this.errorRegistro = true;
      this.resultadoVictoria = false;
      this.mensajeResultado =
        'No se pudo registrar el resultado del juego.';
      this.mostrarResultado = true;
      this.cdr.detectChanges();
    } finally {
      this.registrandoResultado = false;
    }
  }
  reiniciarDesdeNivel1(): void {
    if (this.partidaPorDescuento) {
      this.volverAJuegos();
      return;
    }
    this.nivelActual = 1;
    this.mostrarResultado = false;
    this.iniciarJuego();
  }
  continuarNivel(): void {
    if (this.partidaPorDescuento) {
      this.volverAJuegos();
      return;
    }
    this.mostrarResultado = false;
    if (this.resultadoVictoria) {
      if (
        this.nivelActual <
        this.maximoNiveles
      ) {
        this.nivelActual++;
        this.iniciarJuego();
        return;
      }
      this.iniciarJuego();
      return;
    }
    this.iniciarJuego();
  }
  private mezclarCartas(
    cartas: CartaMemoria[]
  ): CartaMemoria[] {
    return cartas
      .map(carta => ({
        carta,
        orden: Math.random()
      }))
      .sort(
        (a, b) =>
          a.orden - b.orden
      )
      .map(
        item => item.carta
      );
  }
  volverAJuegos(): void {
    this.mostrarResultado = false;
    window.history.back();
  }
}
