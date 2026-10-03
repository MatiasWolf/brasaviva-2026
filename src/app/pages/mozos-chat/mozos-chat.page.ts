import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ViewChild,
  ElementRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  IonFooter,
} from '@ionic/angular';

import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { MensajeChat } from '../../core/models/mensaje-chat.model';

/**
 * Sala general de consultas: todas las mesas y todos los mozos hablan
 * en un mismo canal, cada mensaje identificado por mesa o por el nombre
 * del mozo, con fecha y hora.
 */
@Component({
  selector: 'app-mozos-chat',
  templateUrl: './mozos-chat.page.html',
  styleUrls: ['./mozos-chat.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
    IonFooter,
  ]
})
export class MozosChatPage implements OnInit, OnDestroy {

  private chatService = inject(ChatService);
  private authService = inject(AuthService);

  mensajes = signal<MensajeChat[]>([]);
  numerosMesa = signal<Record<string, number>>({});

  nuevoMensaje = signal('');
  cargando = signal(true);
  enviando = signal(false);

  @ViewChild('chatContent')
  chatContent?: IonContent;

  @ViewChild('mensajesContainer')
  mensajesContainer?: ElementRef<HTMLElement>;

  async ngOnInit(): Promise<void> {
    await this.cargarChat();
  }

  ngOnDestroy(): void {
    this.chatService.cerrarEscuchaChatGeneral();
  }

  async cargarChat(): Promise<void> {
    this.cargando.set(true);
    try {
      const mensajes = await this.chatService.obtenerTodosLosMensajes();
      this.mensajes.set(mensajes);
      await this.resolverNumerosMesaFaltantes(mensajes);

      setTimeout(() => this.scrollAlFinal(), 100);

      this.chatService.escucharChatGeneral(async (mensaje) => {
        const yaExiste = this.mensajes().some((m) => m.id === mensaje.id);
        if (yaExiste) {
          return;
        }
        this.mensajes.update((mensajes) => [...mensajes, mensaje]);
        await this.resolverNumerosMesaFaltantes([mensaje]);
        setTimeout(() => this.scrollAlFinal(), 100);
      });
    } catch (error) {
      console.error('MOZOS CHAT - error cargando chat:', error);
    } finally {
      this.cargando.set(false);
    }
  }

  private async resolverNumerosMesaFaltantes(mensajes: MensajeChat[]): Promise<void> {
    const faltantes = new Set(
      mensajes
        .map((m) => m.mesa_id)
        .filter((id): id is string => !!id && this.numerosMesa()[id] === undefined)
    );

    if (faltantes.size === 0) {
      return;
    }

    const resueltos = await Promise.all(
      [...faltantes].map(async (mesaId) => ({
        mesaId,
        numero: await this.chatService.obtenerNumeroMesa(mesaId),
      }))
    );

    this.numerosMesa.update((actual) => {
      const copia = { ...actual };
      for (const { mesaId, numero } of resueltos) {
        if (numero !== null) {
          copia[mesaId] = numero;
        }
      }
      return copia;
    });
  }

  numeroDeMesa(mensaje: MensajeChat): number | null {
    return mensaje.mesa_id ? this.numerosMesa()[mensaje.mesa_id] ?? null : null;
  }

  esMensajePropio(mensaje: MensajeChat): boolean {
    const mozo = this.authService.usuarioActual;
    if (!mozo || mensaje.emisor_tipo !== 'mozo') {
      return false;
    }
    return mensaje.emisor_id === mozo.id;
  }

  async enviarMensaje(): Promise<void> {
    const texto = this.nuevoMensaje().trim();
    const mozo = this.authService.usuarioActual;
    if (!texto || !mozo || this.enviando()) {
      return;
    }
    try {
      this.enviando.set(true);
      const nombreMozo = `${mozo.nombre ?? ''} ${mozo.apellido ?? ''}`.trim() || 'Mozo';
      await this.chatService.enviarMensajeGeneralMozo(mozo.id, nombreMozo, texto);
      this.nuevoMensaje.set('');
    } catch (error) {
      console.error('MOZOS CHAT - error al enviar mensaje:', error);
    } finally {
      this.enviando.set(false);
    }
  }

  async scrollAlFinal(): Promise<void> {
    const contenedor = this.mensajesContainer?.nativeElement;
    if (contenedor) {
      contenedor.scrollTo({ top: contenedor.scrollHeight, behavior: 'smooth' });
    }
    await this.chatContent?.scrollToBottom(300);
  }
}
