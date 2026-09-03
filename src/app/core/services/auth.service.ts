import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Usuario } from '../models/usuario.model';
import { PerfilRapido } from '../models/perfil-rapido.model';
import { ROLES_CLIENTE } from '../models/boton-menu.model';

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
        .select('id, rol_nombre, correo, clave, orden')
        .order('orden');

    if (error) {
      console.error('Error al obtener perfiles rápidos:', error);
      return [];
    }

    return (data ?? []) as PerfilRapido[];
  }

  async logout(): Promise<void> {
    const { error } =
      await this.supabaseService.client.auth.signOut();

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
  }) {
    console.log('AUTH 1: antes de signUp');

    // 1. Crear usuario en Supabase Auth
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

    console.log('AUTH 2: signUp terminó');
    console.log('AUTH data:', data);
    console.log('AUTH error:', error);

    if (error) {
      throw error;
    }

    // Verificar que Supabase haya creado el usuario
    if (!data.user) {
      throw new Error('No se pudo crear el usuario.');
    }

    console.log('AUTH 3: voy a retornar');

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