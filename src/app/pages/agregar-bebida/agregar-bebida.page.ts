import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonInput,
  IonTextarea,
  IonTitle,
  IonToolbar,
  IonIcon
} from '@ionic/angular';
import { BebidaService } from '../../core/services/bebida.service';
import { SpinnerLogoComponent } from '../../shared/components/spinner-logo/spinner-logo.component';
import { MensajeModalService } from '../../core/services/mensaje-modal.service';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  chevronBackOutline,
  chevronForwardOutline,
  wineOutline,
  cameraOutline,
  imagesOutline,
  repeatOutline
} from 'ionicons/icons';

interface FotoSlot {
  archivo: File | null;
  previewUrl: string | null;
}

@Component({
  selector: 'app-agregar-bebida',
  templateUrl: './agregar-bebida.page.html',
  styleUrls: ['./agregar-bebida.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonFooter,
    IonInput,
    IonTextarea,
    IonButton,
    IonIcon,
    SpinnerLogoComponent
  ]
})
export class AgregarBebidaPage {

  bebidaForm: FormGroup;

  fotos: FotoSlot[] = [
    { archivo: null, previewUrl: null },
    { archivo: null, previewUrl: null },
    { archivo: null, previewUrl: null }
  ];

  enviando = false;

  mensajeError = '';

  /** Índice de la foto visible en el carrusel (0, 1 o 2). */
  fotoActiva = 0;

  private readonly fb = inject(FormBuilder);
  private readonly bebidaService = inject(BebidaService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly mensajeModal = inject(MensajeModalService);

  constructor() {
    addIcons({
      'checkmark-circle': checkmarkCircle,
      'chevron-back-outline': chevronBackOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'wine-outline': wineOutline,
      'camera-outline': cameraOutline,
      'images-outline': imagesOutline,
      'repeat-outline': repeatOutline
    });

    this.bebidaForm = this.fb.group({
      nombre: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(60)
        ]
      ],

      descripcion: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(300)
        ]
      ],

      tiempoElaboracion: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{1,3}$/),
          Validators.min(1),
          Validators.max(240)
        ]
      ],

      precio: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
          Validators.min(0.01)
        ]
      ]
    });
  }

  seleccionarFoto(indice: number, event: Event) {

    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;

    if (!archivo) {
      return;
    }

    if (!archivo.type.startsWith('image/')) {
      this.mostrarError('El archivo elegido no es una imagen.');
      input.value = '';
      return;
    }

    if (this.fotos[indice].previewUrl) {
      URL.revokeObjectURL(this.fotos[indice].previewUrl!);
    }

    this.fotos[indice] = {
      archivo,
      previewUrl: URL.createObjectURL(archivo)
    };

    this.mensajeError = '';

    input.value = '';
  }

  fotoAnterior(): void {
    this.fotoActiva = (this.fotoActiva + this.fotos.length - 1) % this.fotos.length;
  }

  fotoSiguiente(): void {
    this.fotoActiva = (this.fotoActiva + 1) % this.fotos.length;
  }

  irAFoto(indice: number): void {
    this.fotoActiva = indice;
  }

  get faltanFotos(): boolean {
    return this.fotos.some(foto => !foto.archivo);
  }

  get fotosCargadas(): number {
    return this.fotos.filter(foto => foto.archivo).length;
  }

  async guardarBebida() {

    this.mensajeError = '';

    if (this.bebidaForm.invalid) {
      this.bebidaForm.markAllAsTouched();
      await this.mostrarError('Completá correctamente todos los campos.');
      return;
    }

    if (this.faltanFotos) {
      await this.mostrarError('Debés cargar las tres fotos de la bebida.');
      return;
    }

    const {
      nombre,
      descripcion,
      tiempoElaboracion,
      precio
    } = this.bebidaForm.value;

    this.enviando = true;

    try {

      await this.bebidaService.crearBebida(
        {
          nombre,
          descripcion,
          tiempo_preparacion: Number(tiempoElaboracion),
          precio: Number(precio)
        },
        this.fotos.map(foto => foto.archivo as File)
      );

      this.mensajeModal.exito(
        'La bebida fue guardada correctamente y ya forma parte de la carta.',
        '¡Bebida agregada!'
      );
      await this.router.navigate(['/carta-bebidas']);

    } catch (error: any) {

      console.error('AGREGAR BEBIDA ERROR:', error);

      await this.mostrarError(
        this.traducirError(error)
      );

    } finally {

      this.enviando = false;
      this.cdr.detectChanges();
    }
  }

  /** Muestra el error en pantalla, con vibración. */
  private async mostrarError(mensaje: string): Promise<void> {

    this.mensajeError = mensaje;
    this.vibrar();
    this.cdr.detectChanges();

    this.mensajeModal.error(mensaje);
  }

  private vibrar(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([180, 80, 180]);
    }
  }

  private traducirError(error: any): string {

    const mensaje = (error?.message ?? '').toLowerCase();

    if (mensaje.includes('bucket not found')) {
      return 'No se encontró el depósito de imágenes. Avisá al administrador.';
    }

    if (mensaje.includes('row-level security') || mensaje.includes('permission denied')) {
      return 'Tu usuario no tiene permisos para cargar bebidas.';
    }

    if (mensaje.includes('duplicate') || mensaje.includes('already exists')) {
      return 'Ya existe una bebida con ese nombre en la carta.';
    }

    if (mensaje.includes('network') || mensaje.includes('fetch')) {
      return 'Sin conexión. Revisá tu internet e intentá de nuevo.';
    }

    return 'No se pudo guardar la bebida. Intentá nuevamente.';
  }

}
