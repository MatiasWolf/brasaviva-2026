import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,  
  AbstractControl, 
  ValidationErrors
} from '@angular/forms';
import { Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonTitle, IonToolbar, IonIcon, IonModal } from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';
import { CameraService } from '../../../core/services/camera.service';
import { addIcons } from 'ionicons';
import { checkmarkCircle, personAddOutline, cameraOutline} from 'ionicons/icons';
import { AnonymousSessionService } from '../../../core/services/anonymous-session.service';
import { StorageService } from '../../../core/services/storage.service';



@Component({
  selector: 'app-registro-cliente',
  templateUrl: './registro-cliente.page.html',
  styleUrls: ['./registro-cliente.page.scss'],
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
    IonModal,
    IonIcon
]
})
export class RegistroClientePage {

  registroForm: FormGroup;

  enviando = false;

  mensajeError = '';

  isModalOpen = false;

  fotoPreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private cameraService: CameraService,
    private anonymousSessionService: AnonymousSessionService,
    private storageService: StorageService
  ) {
    addIcons({
      'checkmark-circle': checkmarkCircle,
      'person-add-outline': personAddOutline,
      'camera-outline': cameraOutline
    });

    this.registroForm = this.fb.group(
    {
      apellido: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        ]
      ],

      nombre: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        ]
      ],

      dni: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{7,8}$/)
        ]
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[^\s@]+@[^\s@]+\.com$/),
          Validators.maxLength(100)
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(50)
        ]
      ],

      confirmPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(50)
        ]
      ]
    },
    {
      validators: this.passwordsIguales
    }
  );
  }

  async registrarCliente() {

  this.mensajeError = '';

  // Validar formulario
  if (this.registroForm.invalid) {
    this.registroForm.markAllAsTouched();
    this.mensajeError = 'Completá correctamente todos los campos.';
    return;
  }

  if (!this.fotoPreview) { 
    this.mensajeError = 'Debés agregar una foto de perfil.'; 
    return; 
  }

  // Obtener valores
  const {
    apellido,
    nombre,
    dni,
    email,
    password
  } = this.registroForm.value;

  this.enviando = true;

  try {

    await this.auth.registrarCliente({
      apellido,
      nombre,
      dni,
      email,
      password,
      foto: this.fotoPreview!
    });

    this.isModalOpen = true;
    this.cdr.detectChanges();


  } catch (error: any) {

    console.error('REGISTRO ERROR:', error);

    this.mensajeError =
      this.obtenerMensajeError(error);

  } finally {

    this.enviando = false;
  }
}

  private passwordsIguales(
    control: AbstractControl
  ): ValidationErrors | null {

    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword
      ? null
      : { passwordsNoCoinciden: true };
  }

  private obtenerMensajeError(error: any): string {

    const mensaje = error?.message?.toLowerCase() || '';

    if (
      mensaje.includes('already registered') ||
      mensaje.includes('already exists') ||
      mensaje.includes('ya está registrado')
    ) {
      return 'Ese correo ya se encuentra registrado.';
    }

    if (
      mensaje.includes('password') &&
      mensaje.includes('6')
    ) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (
      mensaje.includes('email')
    ) {
      return 'El correo electrónico no es válido.';
    }

    if (
      mensaje.includes('dni')
    ) {
      return 'El DNI ingresado no es válido o ya se encuentra registrado.';
    }

    return 'No se pudo completar el registro. Intentá nuevamente.';
  }

  irAlLogin() {

    this.router.navigate(
      ['/login']
    );
  }

  async ingresarComoInvitado(): Promise<void> {
    if (!this.fotoPreview) {
      this.mensajeError = 'No se encontró la foto de perfil.';
      return;
    }

    const { nombre, apellido } = this.registroForm.value;

    try {
      // Cerrar la sesión del usuario registrado
      await this.auth.logout();

      // Crear la sesión anónima con los mismos datos
      const sesion = await this.anonymousSessionService.crearSesion(
        nombre,
        apellido
      );

      // Subir la foto para la sesión anónima
      const fotoUrl = await this.storageService.subirFoto(
        sesion.id,
        this.fotoPreview
      );

      // Asociar la foto a la sesión
      await this.anonymousSessionService.actualizarFoto(fotoUrl);

      // Cerrar el modal y entrar al Home
      this.isModalOpen = false;
      this.cdr.detectChanges();

      await this.router.navigate(['/home']);

    } catch (error) {
      console.error('Error al ingresar como invitado:', error);
      this.mensajeError =
        'No se pudo iniciar la sesión como invitado.';
    }
  }

  async tomarFoto() {
    this.mensajeError = '';

    try {
      const foto = await this.cameraService.tomarFoto();

      this.fotoPreview = foto.webPath ?? null;

      this.cdr.detectChanges();

    } catch (error) {
      console.error('Error al tomar la foto:', error);
      this.mensajeError =
        'No se pudo obtener la foto. Intentá nuevamente.';
    }
  }

}

