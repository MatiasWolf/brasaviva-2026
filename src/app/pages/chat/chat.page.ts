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
import { MensajeChat } from '../../core/models/mensaje-chat.model';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
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
  ],
})
export class ChatPage implements OnInit, OnDestroy {

  private chatService = inject(ChatService);

  /** Todos los mensajes de la sala general: todas las mesas, todos los mozos. */
  mensajes = signal<MensajeChat[]>([]);

  /** Números de mesa resueltos, para mostrar "Mesa X" en cada mensaje de cliente. */
  numerosMesa = signal<Record<string, number>>({});

  /** La mesa propia: hace falta para poder enviar mensajes identificados. */
  mesaId = signal<string | null>(null);
  ocupacionId = signal<number | null>(null);

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

  async cargarChat(): Promise<void> {
    try {
      this.cargando.set(true);
      const ocupacion =
        await this.chatService.obtenerOcupacionActual();
      if (!ocupacion) {
        console.warn(
          'CHAT - no hay ocupación activa'
        );
        this.mesaId.set(null);
        this.ocupacionId.set(null);
        return;
      }
      this.mesaId.set(ocupacion.mesa_id);
      this.ocupacionId.set(ocupacion.id);

      const mensajes =
        await this.chatService.obtenerTodosLosMensajes();
      this.mensajes.set(mensajes);
      await this.resolverNumerosMesaFaltantes(mensajes);

      setTimeout(() => {
        this.scrollAlFinal();
      }, 100);

      this.chatService.escucharChatGeneral(
        (mensajeNuevo) => {
          const yaExiste =
            this.mensajes().some(
              mensaje =>
                mensaje.id === mensajeNuevo.id
            );
          if (yaExiste) {
            return;
          }
          this.mensajes.update(
            mensajes => [
              ...mensajes,
              mensajeNuevo
            ]
          );
          void this.resolverNumerosMesaFaltantes([mensajeNuevo]);
          setTimeout(() => {
            this.scrollAlFinal();
          }, 100);
        }
      );
    } catch (error) {
      console.error(
        'CHAT ERROR:',
        error
      );
    } finally {
      this.cargando.set(false);
    }
  }

  /** Busca el número de las mesas que todavía no tenemos resuelto. */
  private async resolverNumerosMesaFaltantes(mensajes: MensajeChat[]): Promise<void> {
    const faltantes = new Set(
      mensajes
        .map(m => m.mesa_id)
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

    this.numerosMesa.update(actual => {
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


  async enviarMensaje(): Promise<void> {
    const texto =
      this.nuevoMensaje().trim();
    const mesa = this.mesaId();
    const ocupacion = this.ocupacionId();
    if (
      !texto ||
      !mesa ||
      ocupacion === null ||
      this.enviando()
    ) {
      return;
    }
    try {
      this.enviando.set(true);
      await this.chatService.enviarMensajeMesa(
        mesa,
        ocupacion,
        texto
      );
      this.nuevoMensaje.set('');

    } catch (error) {
      console.error(
        'Error al enviar mensaje:',
        error
      );

    } finally {
      this.enviando.set(false);
    }
  }


  ngOnDestroy(): void {
    this.chatService.cerrarEscuchaChatGeneral();
  }

  async scrollAlFinal(): Promise<void> {
    const contenedor =
      this.mensajesContainer?.nativeElement;
    if (contenedor) {
      contenedor.scrollTo({
        top: contenedor.scrollHeight,
        behavior: 'smooth'
      });
    }
    await this.chatContent?.scrollToBottom(300);
  }
}
