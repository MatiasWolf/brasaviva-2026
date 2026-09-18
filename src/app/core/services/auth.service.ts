import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { StorageService } from './storage.service';
import { Usuario } from '../models/usuario.model';
import { PerfilRapido } from '../models/perfil-rapido.model';
import {
  ROLES_CLIENTE,
  EstadiaEstado
} from '../models/boton-menu.model';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabaseService = inject(SupabaseService);
  private storageService = inject(StorageService);



  usuarioActual: Usuario | null = null;

  async login(email: string, password: string): Promise<Usuario> {
    const { data, error } =
      await this.supabaseService.client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
    if (error) {
      throw error;
    }
    if (!data.user) {
      throw new AuthError('No se pudo iniciar sesión.');
    }
    const perfil = await this.obtenerPerfil(data.user.id);
    if (!perfil) {
      await this.supabaseService.client.auth.signOut();
      throw new AuthError(
        'No encontramos tu perfil. Contactá al restaurante.'
      );
    }
    await this.validarEstado(perfil);
    this.usuarioActual = perfil;
    return perfil;
  }

  async obtenerPerfil(uid: string): Promise<Usuario | null> {
    const { data, error } =
      await this.supabaseService.client
        .from('usuarios')
        .select('*, roles(nombre)')
        .eq('id', uid)
        .single();
    if (error) {
      console.error('Error al obtener perfil:', error);
      return null;
    }
    return data as Usuario;
  }

  async cargarUsuarioActual(): Promise<Usuario | null> {
    const { data } =
      await this.supabaseService.client.auth.getSession();
    if (!data.session) {
      this.usuarioActual = null;
      return null;
    }
    this.usuarioActual = await this.obtenerPerfil(data.session.user.id);
    return this.usuarioActual;
  }

  async getSesionActiva(): Promise<boolean> {
    const { data } =
      await this.supabaseService.client.auth.getSession();
    return !!data.session;
  }

  async getPerfilesRapidos(): Promise<PerfilRapido[]> {
    const { data, error } =
      await this.supabaseService.client
        .from('perfiles_rapidos')
        .select('id, rol_nombre, correo, clave, orden, imagen_url')
        .order('orden');
    if (error) {
      console.error('Error al obtener perfiles rápidos:', error);
      return [];
    }
    return (data ?? []) as PerfilRapido[];
  }

  async actualizarEstadoEstadia(
    estado: EstadiaEstado
  ): Promise<void> {
    if (!this.usuarioActual) {
      throw new Error(
        'No hay un usuario registrado activo.'
      );
    }
    const { error } =
      await this.supabaseService.client
        .from('usuarios')
        .update({
          estado_estadia: estado
        })
        .eq('id', this.usuarioActual.id);
    if (error) {
      throw error;
    }
    this.usuarioActual = {
      ...this.usuarioActual,
      estado_estadia: estado
    };
  }

  async logout(): Promise<void> {
    const usuario = this.usuarioActual;
    try {
      if (usuario?.roles?.nombre === 'cliente_registrado') {
        try {
          await this.actualizarEstadoEstadia('sin_estadia');
        } catch (error) {
          console.error(
            'Error al reiniciar estado de estadía durante logout:',
            error
          );
        }
      }
      const { error } = await this.supabaseService.client.auth.signOut();
      if (error) {
        throw error;
      }
    } finally {
      this.usuarioActual = null;
    }
  }
 
  async logoutLocal(): Promise<void> {
    const { error } =
      await this.supabaseService.client.auth.signOut({
        scope: 'local'
      });
    if (error) {
      throw error;
    }
    this.usuarioActual = null;
  }

  async registrarCliente(datos: {
    apellido: string;
    nombre: string;
    dni: string;
    email: string;
    password: string;
    foto: string;
  }) {
    if (!datos.foto) { 
      throw new Error('La foto de perfil es obligatoria.'); 
    }

    const { data, error } =
      await this.supabaseService.client.auth.signUp({
        email: datos.email,
        password: datos.password,
        options: {
          data: {
            apellido: datos.apellido,
            nombre: datos.nombre,
            dni: datos.dni,
          },
        },
      });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('No se pudo crear el usuario.');
    }

    const fotoUrl = await this.storageService.subirFoto(
      data.user.id,
      datos.foto
    );

    const { error: errorFoto } = await this.supabaseService.client
      .from('usuarios')
      .update({
        foto_url: fotoUrl
      })
      .eq('id', data.user.id);

    if (errorFoto) {
      console.error('Error al guardar foto_url:', errorFoto);
      throw errorFoto;
    }
    return data;
  }

  private async validarEstado(perfil: Usuario): Promise<void> {
    const esCliente = ROLES_CLIENTE.includes(
      perfil.roles?.nombre ?? ''
    );

    const bloqueado =
      perfil.estado === 'rechazado' ||
      (esCliente && perfil.estado === 'pendiente');

    if (!bloqueado) {
      return;
    }

    await this.supabaseService.client.auth.signOut();
    this.usuarioActual = null;

    throw new AuthError(
      perfil.estado === 'rechazado'
        ? 'Tu cuenta fue rechazada. Contactá al restaurante.'
        : 'Tu cuenta todavía está pendiente de aprobación.'
    );
  }
}