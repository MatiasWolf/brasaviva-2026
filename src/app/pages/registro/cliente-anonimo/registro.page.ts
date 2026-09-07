import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnonymousSessionService } from '../../../core/services/anonymous-session.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../../core/services/storage.service';

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

import { CameraService } from '../../../core/services/camera.service';

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
    private router: Router,
    private cameraService: CameraService,
    private cdr: ChangeDetectorRef,
    private anonymousSessionService: AnonymousSessionService,
    private storageService: StorageService,
    private authService: AuthService
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

  async tomarFoto(): Promise<void> {
    try {

      const foto = await this.cameraService.tomarFoto();

      this.fotoPreview = foto.webPath ?? null;

      this.cdr.detectChanges();

    } catch (error) {
      console.error('Error al tomar la foto:', error);

    }
  }

  async continuar(): Promise<void> {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    if (!this.fotoPreview) {
      return;
    }

    const { nombre, apellido } = this.registroForm.value;

  
    try {
    // Si este dispositivo tenía una sesión registrada,
    // la cerramos solamente en este dispositivo.
    await this.authService.logoutLocal();

    // 1. Crear sesión anónima
    const sesion = await this.anonymousSessionService.crearSesion(
      nombre,
      apellido
    );

    // 2. Subir foto usando el UUID de la sesión
    const fotoUrl = await this.storageService.subirFoto(
      sesion.id,
      this.fotoPreview
    );

    // 3. Guardar la URL real de Storage en la sesión
    await this.anonymousSessionService.actualizarFoto(fotoUrl);

    await this.router.navigate(['/home']);

    } catch (error) {
      console.error('Error durante el registro del invitado:', error);
    }
  }



  volverAlLogin(): void {
    this.router.navigate(['/login']);
  }

}
