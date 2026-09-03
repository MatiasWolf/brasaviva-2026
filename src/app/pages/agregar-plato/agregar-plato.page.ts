import { Component, ChangeDetectorRef } from '@angular/core';
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
  IonModal
} from '@ionic/angular';
import { PlatoService } from '../../core/services/plato.service';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  restaurantOutline,
  cameraOutline,
  imagesOutline,
  closeCircle
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
    IonIcon
  ]
})
export class AgregarPlatoPage {

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
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      'checkmark-circle': checkmarkCircle,
      'restaurant-outline': restaurantOutline,
      'camera-outline': cameraOutline,
      'images-outline': imagesOutline,
      'close-circle': closeCircle
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

  quitarFoto(indice: number) {

    if (this.fotos[indice].previewUrl) {
      URL.revokeObjectURL(this.fotos[indice].previewUrl!);
    }

    this.fotos[indice] = { archivo: null, previewUrl: null };
  }

  get faltanFotos(): boolean {
    return this.fotos.some(foto => !foto.archivo);
  }

  async guardarPlato() {

    this.mensajeError = '';

    if (this.platoForm.invalid) {
      this.platoForm.markAllAsTouched();
      this.mensajeError = 'Completá correctamente todos los campos.';
      return;
    }

    if (this.faltanFotos) {
      this.mensajeError = 'Debés cargar las tres fotos del plato.';
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

      this.mensajeError =
        error?.message || 'No se pudo guardar el plato. Intentá nuevamente.';

    } finally {

      this.enviando = false;
      this.cdr.detectChanges();
    }
  }

  irALaCarta() {
    this.isModalOpen = false;
    this.router.navigate(['/carta']);
  }

}
