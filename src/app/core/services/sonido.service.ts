
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
    const audio = new Audio(
      this.sonidos[sonido]
    );

    audio.volume = 0.7;

    audio.play().catch(error => {
      console.warn(
        'No se pudo reproducir el sonido:',
        error
      );
    });
  }
}

