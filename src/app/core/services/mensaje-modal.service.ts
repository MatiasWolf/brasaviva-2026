import { Injectable, signal } from '@angular/core';

export type TipoMensajeModal = 'exito' | 'error';

@Injectable({
  providedIn: 'root',
})
export class MensajeModalService {
  readonly abierto = signal(false);
  readonly tipo = signal<TipoMensajeModal>('exito');
  readonly titulo = signal('');
  readonly mensaje = signal('');
  readonly textoBoton = signal('Aceptar');

  exito(mensaje: string, titulo = '¡Listo!', textoBoton = 'Aceptar'): void {
    this.mostrar('exito', titulo, mensaje, textoBoton);
  }

  error(mensaje: string, titulo = 'No se pudo completar', textoBoton = 'Cerrar'): void {
    this.mostrar('error', titulo, mensaje, textoBoton);
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  private mostrar(tipo: TipoMensajeModal, titulo: string, mensaje: string, textoBoton: string): void {
    this.tipo.set(tipo);
    this.titulo.set(titulo);
    this.mensaje.set(mensaje);
    this.textoBoton.set(textoBoton);
    this.abierto.set(true);
  }
}
