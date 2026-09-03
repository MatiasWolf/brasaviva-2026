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
  IonModal
} from '@ionic/angular';
import { BebidaService } from '../../core/services/bebida.service';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  wineOutline,
  cameraOutline,
  imagesOutline,
  closeCircle
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
    IonInput,
    IonTextarea,
    IonButton,
    IonModal,
    IonIcon
  ]
})
export class AgregarBebidaPage {

  @ViewChild(IonModal) modalExito?: IonModal;

  bebidaForm: FormGroup;

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
    private bebidaService: BebidaService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      'checkmark-circle': checkmarkCircle,
      'wine-outline': wineOutline,
      'camera-outline': cameraOutline,
      'images-outline': imagesOutline,
      'close-circle': closeCircle
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

  async guardarBebida() {

    this.mensajeError = '';

    if (this.bebidaForm.invalid) {
      this.bebidaForm.markAllAsTouched();
      this.mensajeError = 'Completá correctamente todos los campos.';
      return;
    }

    if (this.faltanFotos) {
      this.mensajeError = 'Debés cargar las tres fotos de la bebida.';
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

      this.isModalOpen = true;

    } catch (error: any) {

      console.error('AGREGAR BEBIDA ERROR:', error);

      this.mensajeError =
        error?.message || 'No se pudo guardar la bebida. Intentá nuevamente.';

    } finally {

      this.enviando = false;
      this.cdr.detectChanges();
    }
  }

  async irALaCarta() {
    await this.modalExito?.dismiss();
    this.isModalOpen = false;
    await this.router.navigate(['/carta-bebidas']);
  }

}
