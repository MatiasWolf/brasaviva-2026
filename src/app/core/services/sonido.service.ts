
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SonidoService {
  private readonly sonidos = {
    correcta: 'assets/sounds/respuestaCorrecta.mp3',
    incorrecta: 'assets/sounds/respuestaIncorrecta.mp3',
    victoria: 'assets/sounds/victoria.mp3',
    derrota: 'assets/sounds/derrota.mp3'
  };

  reproducir(
    sonido: keyof typeof this.sonidos
  ): void {
    try {
      const audio = new Audio(
        this.sonidos[sonido]
      );

      audio.volume = 0.7;

      audio.play()?.catch(error => {
        console.warn(
          'No se pudo reproducir el sonido:',
          error
        );
      });
    } catch (error) {
      console.warn(
        'No se pudo reproducir el sonido:',
        error
      );
    }
  }

  /** Vibra con el patrón dado. No hace nada si el dispositivo no soporta vibrar. */
  vibrar(patron: number[] = [180, 80, 180]): void {
    try {
      navigator.vibrate?.(patron);
    } catch {
      // Sin vibración el resto del feedback (sonido/modal) igual avisa.
    }
  }

  /** Vibración corta para avisar un error. */
  vibrarError(): void {
    this.vibrar([180, 80, 180]);
  }
}

