import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, IonItem, IonLabel, IonRange, IonRadioGroup, IonRadio, IonSelect, IonSelectOption, IonToggle, IonTextarea, IonButtons, IonBackButton } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { star, starOutline, fastFoodOutline, peopleOutline } from 'ionicons/icons';

import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { AnonymousSessionService } from '../../core/services/anonymous-session.service';
import { EncuestaService } from '../../core/services/encuesta.service';
import { MensajeModalService } from '../../core/services/mensaje-modal.service';
import { SpinnerLogoComponent } from '../../shared/components/spinner-logo/spinner-logo.component';
import { MensajeModalComponent } from '../../shared/components/mensaje-modal/mensaje-modal.component';
import { traducirErrorSupabase } from '../../core/utils/traducir-error.util';
import { RespuestaEncuesta } from '../../core/models/encuesta.model';

@Component({
  selector: 'app-realizar-encuesta',
  templateUrl: './realizar-encuesta.page.html',
  styleUrls: ['./realizar-encuesta.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonRange,
    IonRadioGroup,
    IonRadio,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonTextarea,
    SpinnerLogoComponent,
    MensajeModalComponent,
    IonButtons,
    IonBackButton
]
})
export class RealizarEncuestaPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly supabaseService = inject(SupabaseService);
  private readonly authService = inject(AuthService);
  private readonly anonymousSession = inject(AnonymousSessionService);
  private readonly encuestaService = inject(EncuestaService);
  private readonly mensajeModal = inject(MensajeModalService);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly puntajeAtencion = signal(0);

  readonly paso = signal(1);
  readonly totalPasos = 3;

  encuestaForm!: FormGroup;
  private ocupacionId: number | null = null;

  /**
   * No es un computed() a propósito: la validez de un FormGroup no es una
   * signal, así que se re-evalúa en cada ciclo de detección de cambios
   * (se dispara solo con cada interacción del usuario en el formulario).
   */
  pasoEsValido(): boolean {
    switch (this.paso()) {
      case 1:
        return (
          this.encuestaForm.get('puntaje_comida')?.valid === true &&
          this.puntajeAtencion() > 0
        );
      case 2:
        return (
          this.encuestaForm.get('tiempo_espera')?.valid === true &&
          this.encuestaForm.get('aspecto_destacado')?.valid === true
        );
      default:
        return true;
    }
  }

  constructor() {
    addIcons({ star, starOutline, fastFoodOutline, peopleOutline });
    this.inicializarFormulario();
  }

  async ngOnInit(): Promise<void> {
    await this.validarYObtenerEstadia();
  }

  private inicializarFormulario(): void {
  this.encuestaForm = this.fb.group({
    puntaje_comida: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
    tiempo_espera: ['', [Validators.required]],
    recomienda: [false, [Validators.required]],
    aspecto_destacado: ['', [Validators.required]],
    comentario: ['', [Validators.maxLength(300)]]
  });
}

  setRatingAtencion(valor: number): void {
    this.puntajeAtencion.set(valor);
  }

  pasoSiguiente(): void {
    if (!this.pasoEsValido()) {
      this.mensajeModal.error('Completá esta sección antes de continuar.', 'Faltan datos');
      return;
    }
    this.paso.update((p) => Math.min(this.totalPasos, p + 1));
  }

  pasoAnterior(): void {
    this.paso.update((p) => Math.max(1, p - 1));
  }

  private async validarYObtenerEstadia(): Promise<void> {
    try {
      this.cargando.set(true);
      const usuario = this.authService.usuarioActual;
      const sesionAnonimaId = this.anonymousSession.obtenerIdSesion();

      let consulta = this.supabaseService.client
        .from('ocupaciones_mesa')
        .select('id')
        .eq('estado', 'activa')
        .order('created_at', { ascending: false }) // Trae las más nuevas primero
        .limit(1); // Se queda solo con la última de la lista

      if (usuario) {
        consulta = consulta.eq('usuario_id', usuario.id);
      } else if (sesionAnonimaId) {
        consulta = consulta.eq('sesion_anonima_id', sesionAnonimaId);
      } else {
        this.desviarAlHome('No se detectó un usuario o sesión activa.');
        return;
      }

      const { data: ocupaciones, error: errorOcupacion } = await consulta;

      if (errorOcupacion) throw errorOcupacion;

      // Al usar .select() común, data es un arreglo. Toma el primer elemento si existe.
      const ocupacion = (ocupaciones && ocupaciones.length > 0) ? ocupaciones[0] : null;

      if (!ocupacion) {
        this.desviarAlHome('No tenés una estadía activa en una mesa para realizar la encuesta.');
        return;
      }

      const yaRespondida = await this.encuestaService.verificarEncuestaRespondida(ocupacion.id);

      if (yaRespondida) {
        this.mensajeModal.exito(
          'Ya completaste la encuesta de satisfacción correspondiente a esta estadía. Te mostramos los resultados.',
          'Encuesta ya realizada'
        );
        void this.router.navigate(['/resultados-encuesta'], { replaceUrl: true });
        return;
      }

      this.ocupacionId = ocupacion.id;
    } catch (error) {
      console.error('Error en carga de encuesta:', error);
      const msg = traducirErrorSupabase(error);
      this.mensajeModal.error(msg, 'Error de verificación');
      await this.router.navigate(['/home'], { replaceUrl: true });
    } finally {
      this.cargando.set(false);
    }
  }

  private desviarAlHome(mensaje: string): void {
    this.mensajeModal.error(mensaje, 'Acceso no permitido');
    void this.router.navigate(['/home'], { replaceUrl: true });
  }

  async enviarEncuesta(): Promise<void> {
    if (this.encuestaForm.invalid || this.puntajeAtencion() === 0 || !this.ocupacionId) {
      if (this.puntajeAtencion() === 0) {
        this.mensajeModal.error('Por favor, calificá la atención brindada del 1 al 5.', 'Faltan datos');
      } else {
        this.mensajeModal.error('Comprobá que todos los campos obligatorios estén completos.', 'Formulario incompleto');
      }
      return;
    }

    try {
      this.guardando.set(true);

      const respuesta: RespuestaEncuesta = {
        puntaje_comida: this.encuestaForm.value.puntaje_comida,
        puntaje_atencion: this.puntajeAtencion(),
        tiempo_espera: this.encuestaForm.value.tiempo_espera,
        recomienda: this.encuestaForm.value.recomienda,
        aspecto_destacado: this.encuestaForm.value.aspecto_destacado,
        comentario: this.encuestaForm.value.comentario?.trim() || null
      };

      await this.encuestaService.responder(this.ocupacionId, respuesta);

      this.mensajeModal.exito('¡Gracias por tus comentarios! Nos ayudan a mejorar.', '¡Encuesta guardada!');
      // al terminar se muestran los resultados con el voto recién cargado
      void this.router.navigate(['/resultados-encuesta'], { replaceUrl: true });
    } catch (error) {
      console.error('Error al guardar la encuesta:', error);
      const msg = traducirErrorSupabase(error);
      this.mensajeModal.error(msg, 'Error al guardar');
    } finally {
      this.guardando.set(false);
    }
  }
}