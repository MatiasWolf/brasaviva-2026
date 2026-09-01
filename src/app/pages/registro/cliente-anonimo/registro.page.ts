import { Component } from '@angular/core';
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
  IonIcon,
  IonTitle,
  IonToolbar
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  cameraOutline,
  checkmarkCircle
} from 'ionicons/icons';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
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
    IonButton,
    IonIcon
  ]
})
export class RegistroPage {

  registroForm: FormGroup;

  fotoPreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {

    addIcons({
      'camera-outline': cameraOutline,
      'checkmark-circle': checkmarkCircle
    });

    this.registroForm = this.fb.group({
      nombre: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        ]
      ],

      apellido: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        ]
      ]
    });
  }

  tomarFoto(): void {
    /*
     * Por ahora dejamos preparada la acción.
     *
     * En el próximo paso conectaremos la cámara
     * real del teléfono mediante Capacitor.
     */

    console.log('Tomar fotografía');
  }

  continuar(): void {

    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    console.log('Cliente anónimo:', {
      nombre: this.registroForm.value.nombre,
      apellido: this.registroForm.value.apellido,
      foto: this.fotoPreview
    });

    /*
     * Todavía no navegamos.
     *
     * Primero vamos a conectar:
     * 1. Cámara
     * 2. Guardado de foto
     * 3. Registro del cliente anónimo
     * 4. Navegación al inicio
     */
  }

  volverAlLogin(): void {
    this.router.navigate(['/login']);
  }
}