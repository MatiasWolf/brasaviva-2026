import { Component, ChangeDetectorRef, ViewChild } from '@angular/core';
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
  IonHeader,
  IonInput,
  IonTextarea,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonModal,
  ToastController
} from '@ionic/angular';
import { PlatoService } from '../../core/services/plato.service';
import { SpinnerLogoComponent } from '../../shared/components/spinner-logo/spinner-logo.component';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  restaurantOutline,
  cameraOutline,
  imagesOutline,
  repeatOutline
} from 'ionicons/icons';

interface FotoSlot {
  archivo: File | null;
  previewUrl: string | null;
}

@Component({
  selector: 'app-agregar-plato',
  templateUrl: './agregar-plato.page.html',
  styleUrls: ['./agregar-plato.page.scss'],
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
    IonInput,
    IonTextarea,
    IonButton,
    IonModal,
    IonIcon,
    SpinnerLogoComponent
  ]
})
export class AgregarPlatoPage {

  @ViewChild(IonModal) modalExito?: IonModal;

  platoForm: FormGroup;

  fotos: FotoSlot[] = [
    { archivo: null, previewUrl: null },
    { archivo: null, previewUrl: null },
    { archivo: null, previewUrl: null }
  ];

  enviando = false;

  mensajeError = '';

  isModalOpen = false;

  constructor(
    private fb: FormBuilder,
    private platoService: PlatoService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastController: ToastController
  ) {
    addIcons({
      'checkmark-circle': checkmarkCircle,
      'restaurant-outline': restaurantOutline,
      'camera-outline': cameraOutline,
      'images-outline': imagesOutline,
      'repeat-outline': repeatOutline
    });

    this.platoForm = this.fb.group({
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

  get faltanFotos(): boolean {
    return this.fotos.some(foto => !foto.archivo);
  }

  get fotosCargadas(): number {
    return this.fotos.filter(foto => foto.archivo).length;
  }

  async guardarPlato() {

    this.mensajeError = '';

    if (this.platoForm.invalid) {
      this.platoForm.markAllAsTouched();
      await this.mostrarError('Completá correctamente todos los campos.');
      return;
    }

    if (this.faltanFotos) {
      await this.mostrarError('Debés cargar las tres fotos del plato.');
      return;
    }

    const {
      nombre,
      descripcion,
      tiempoElaboracion,
      precio
    } = this.platoForm.value;

    this.enviando = true;

    try {

      await this.platoService.crearPlato(
        {
          nombre,
          descripcion,
          tiempo_preparacion: Number(tiempoElaboracion),
          precio: Number(precio)
        },
        this.fotos.map(foto => foto.archivo as File)
      );

      this.isModalOpen = true;

    } catch (error: any) {

      console.error('AGREGAR PLATO ERROR:', error);

      await this.mostrarError(
        this.traducirError(error)
      );

    } finally {

      this.enviando = false;
      this.cdr.detectChanges();
    }
  }

  async irALaCarta() {
    await this.modalExito?.dismiss();
    this.isModalOpen = false;
    await this.router.navigate(['/carta']);
  }

  /** Muestra el error en pantalla, con un aviso flotante y vibración. */
  private async mostrarError(mensaje: string): Promise<void> {

    this.mensajeError = mensaje;
    this.vibrar();
    this.cdr.detectChanges();

    const aviso = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      position: 'top',
      color: 'danger'
    });

    await aviso.present();
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
      return 'Tu usuario no tiene permisos para cargar platos.';
    }

    if (mensaje.includes('duplicate') || mensaje.includes('already exists')) {
      return 'Ya existe un plato con ese nombre en la carta.';
    }

    if (mensaje.includes('network') || mensaje.includes('fetch')) {
      return 'Sin conexión. Revisá tu internet e intentá de nuevo.';
    }

    return 'No se pudo guardar el plato. Intentá nuevamente.';
  }

}
