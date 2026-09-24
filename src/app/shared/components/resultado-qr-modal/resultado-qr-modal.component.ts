import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ResultadoQrTipo = 'exito' | 'error' | 'sin_asignacion';

@Component({
  selector: 'app-resultado-qr-modal',
  templateUrl: './resultado-qr-modal.component.html',
  styleUrl: './resultado-qr-modal.component.scss'
})
export class ResultadoQrModalComponent {

  @Input() abierto = false;
  @Input() tipo: ResultadoQrTipo = 'exito';
  @Input() titulo = '';
  @Input() mensaje = '';

  @Output() cerrado = new EventEmitter<void>();

  cerrar(): void {
    this.cerrado.emit();
  }
}