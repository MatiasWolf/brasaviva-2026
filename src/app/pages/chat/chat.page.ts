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

  mensajes = signal<MensajeChat[]>([]);

  mesaId = signal<string | null>(null);
  numeroMesa = signal<number | null>(null);
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
          'CHAT 3 - no hay ocupación activa'
        );
        this.mensajes.set([]);
        this.mesaId.set(null);
        this.ocupacionId.set(null);
        this.numeroMesa.set(null);
        return;
      }
      this.mesaId.set(ocupacion.mesa_id);
      this.ocupacionId.set(ocupacion.id);

      const numero =
        await this.chatService.obtenerNumeroMesa(
          ocupacion.mesa_id
        );
      this.numeroMesa.set(numero);
      
      const mensajes =
        await this.chatService.obtenerMensajesOcupacion(
          ocupacion.id
        );
      this.mensajes.set(mensajes);
      setTimeout(() => {
        this.scrollAlFinal();
      }, 100);

      this.chatService.escucharChatOcupacion(
        ocupacion.id,
        (mensajeNuevo) => {
          const yaExiste =
            this.mensajes().some(
              mensaje =>
                mensaje.id === mensajeNuevo.id
            );
          if (yaExiste) {
            console.log(
              'CHAT REALTIME - mensaje ya existente, se ignora'
            );
            return;
          }
          this.mensajes.update(
            mensajes => [
              ...mensajes,
              mensajeNuevo
            ]
          );
          setTimeout(() => {
            this.scrollAlFinal();
          }, 100);
          console.log(
            'CHAT REALTIME - mensaje agregado al chat'
          );
        }
      );
    } catch (error) {
      console.error(
        'CHAT ERROR:',
        error
      );
    } finally {
      console.log(
        'CHAT 9 - finalizando'
      );
      this.cargando.set(false);
    }
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
      console.log(
        'PAGINA 4 - liberando botón'
      );
      this.enviando.set(false);
    }
  }


  ngOnDestroy(): void {
    this.chatService.cerrarEscuchaChatMesa();
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