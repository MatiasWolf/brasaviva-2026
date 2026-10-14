import { Component, ChangeDetectorRef, inject } from '@angular/core';
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
import { IonBackButton, IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonInput, IonTitle, IonToolbar, IonIcon } from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';
import { CameraService } from '../../../core/services/camera.service';
import { addIcons } from 'ionicons';
import { checkmarkCircle, personAddOutline, cameraOutline, scanOutline} from 'ionicons/icons';
import { DniScannerComponent } from '../../../shared/components/dni-scanner/dni-scanner.component';
import { DatosDni } from '../../../core/models/dni.model';
import { MensajeModalService } from '../../../core/services/mensaje-modal.service';



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
    IonFooter,
    IonInput,
    IonButton,
    IonIcon,
    DniScannerComponent
]
})
export class RegistroClientePage {

  registroForm: FormGroup;

  enviando = false;

  mensajeError = '';

  mostrandoScanner = false;

  fotoPreview: string | null = null;

  private readonly mensajeModal = inject(MensajeModalService);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private cameraService: CameraService
  ) {
    addIcons({
      'checkmark-circle': checkmarkCircle,
      'person-add-outline': personAddOutline,
      'camera-outline': cameraOutline,
      'scan-outline': scanOutline
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
      this.mensajeModal.error(this.mensajeError);
      return;
    }

    if (!this.fotoPreview) {
      this.mensajeError = 'Debés agregar una foto de perfil.';
      this.mensajeModal.error(this.mensajeError);
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

      await this.auth.logout().catch((error) =>
        console.error('No se pudo cerrar la sesión tras el registro:', error),
      );

      this.mensajeModal.exito(
        'Tu cuenta quedó pendiente de aprobación. Te avisaremos cuando esté habilitada para ingresar a Brasa Viva.',
        '¡Registro exitoso!',
      );
      await this.router.navigate(['/login']);


    } catch (error: any) {

      console.error('REGISTRO ERROR:', error);

      this.mensajeError =
        this.obtenerMensajeError(error);
      this.mensajeModal.error(this.mensajeError);

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

  escanearDni(): void {
    this.mensajeError = '';
    this.mostrandoScanner = true;
  }

  onDniEscaneado(datos: DatosDni): void {
    this.mostrandoScanner = false;

    this.registroForm.patchValue({
      apellido: datos.apellido,
      nombre: datos.nombre,
      dni: datos.dni
    });
    this.registroForm.get('apellido')?.markAsDirty();
    this.registroForm.get('nombre')?.markAsDirty();
    this.registroForm.get('dni')?.markAsDirty();

    this.cdr.detectChanges();
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
      this.mensajeModal.error(this.mensajeError);
    }
  }

}

