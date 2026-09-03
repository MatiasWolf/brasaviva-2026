import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSpinner
} from '@ionic/angular';
import { BebidaService } from '../../core/services/bebida.service';
import { Bebida } from '../../core/models/bebida.model';

@Component({
  selector: 'app-carta-bebidas',
  templateUrl: './carta-bebidas.page.html',
  styleUrls: ['./carta-bebidas.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonSpinner
  ]
})
export class CartaBebidasPage implements OnInit {

  bebidas: Bebida[] = [];

  cargando = true;

  mensajeError = '';

  constructor(
    private bebidaService: BebidaService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.cargarBebidas();
  }

  async cargarBebidas() {

    this.cargando = true;
    this.mensajeError = '';

    try {

      this.bebidas = await this.bebidaService.listarBebidas();

    } catch (error: any) {

      console.error('CARTA BEBIDAS ERROR:', error);
      this.mensajeError = 'No se pudo cargar la carta. Intentá nuevamente.';

    } finally {

      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

}
