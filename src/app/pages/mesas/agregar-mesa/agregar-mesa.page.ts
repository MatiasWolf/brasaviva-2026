import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cameraOutline, checkmarkCircle, gridOutline } from 'ionicons/icons';

import { MesaService } from '../../../core/services/mesa.service';
import { CameraService } from '../../../core/services/camera.service';
import { Mesa, TIPOS_MESA } from '../../../core/models/mesa.model';
import { MensajeModalService } from '../../../core/services/mensaje-modal.service';
import { traducirErrorSupabase } from '../../../core/utils/traducir-error.util';

@Component({
  selector: 'app-agregar-mesa',
  templateUrl: './agregar-mesa.page.html',
  styleUrls: ['./agregar-mesa.page.scss'],
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
    IonSelect,
    IonSelectOption,
    IonButton,
    IonModal,
    IonIcon,
  ],
})
export class AgregarMesaPage {
  private readonly fb = inject(FormBuilder);
  private readonly mesaService = inject(MesaService);
  private readonly router = inject(Router);

  readonly tipos = TIPOS_MESA;

  readonly fotoPreview = signal<string | null>(null);
  readonly enviando = signal(false);
  readonly mensajeError = signal('');
  readonly modalExito = signal(false);
  readonly mesaCreada = signal<Mesa | null>(null);

  private readonly cameraService = inject(CameraService);
  private readonly mensajeModal = inject(MensajeModalService);

  readonly mesaForm: FormGroup = this.fb.group({
    numero: [
      '',
      [Validators.required, Validators.pattern(/^[1-9]\d{0,3}$/)],
    ],
    comensales: [
      '',
      [
        Validators.required,
        Validators.pattern(/^\d{1,2}$/),
        Validators.min(1),
        Validators.max(30),
      ],
    ],
    tipo: ['', [Validators.required]],
  });

  constructor() {
    addIcons({
      'grid-outline': gridOutline,
      'camera-outline': cameraOutline,
      'checkmark-circle': checkmarkCircle,
    });
  }

  async tomarFoto(): Promise<void> {
    this.mensajeError.set('');
    try {
      const foto = await this.cameraService.tomarFoto();
      if (foto.webPath) {
        this.fotoPreview.set(foto.webPath);
      }
    } catch (error) {
      console.error('Error al tomar la foto:', error);
      this.mostrarError('No se pudo obtener la foto. Intentá nuevamente.');
    }
  }

  async guardar(): Promise<void> {
    this.mensajeError.set('');

    if (this.mesaForm.invalid) {
      this.mesaForm.markAllAsTouched();
      this.mostrarError('Completá correctamente todos los campos.');
      return;
    }
    if (!this.fotoPreview()) {
      this.mostrarError('La foto de la mesa es obligatoria.');
      return;
    }

    const { numero, comensales, tipo } = this.mesaForm.value;
    const numeroNum = Number(numero);
    const comensalesNum = Number(comensales);

    this.enviando.set(true);
    try {
      if (await this.mesaService.existeNumero(numeroNum)) {
        this.mostrarError(`Ya existe una mesa con el número ${numeroNum}.`);
        return;
      }

      const mesa = await this.mesaService.crearMesa({
        numero: numeroNum,
        comensales: comensalesNum,
        tipo,
        fotoWebPath: this.fotoPreview()!,
      });

      // Este éxito sí necesita su propio modal (no el genérico): tiene que
      // mostrar el QR recién generado, que el modal compartido no soporta.
      this.mesaCreada.set(mesa);
      this.modalExito.set(true);
    } catch (error) {
      console.error('ALTA MESA ERROR:', error);
      this.mostrarError(
        traducirErrorSupabase(error, 'No se pudo dar de alta la mesa. Intentá nuevamente.'),
      );
    } finally {
      this.enviando.set(false);
    }
  }

  irAlListado(): void {
    this.modalExito.set(false);
    this.router.navigate(['/mesas'], { replaceUrl: true });
  }

  private mostrarError(mensaje: string): void {
    this.mensajeError.set(mensaje);
    this.mensajeModal.error(mensaje);
  }
}
