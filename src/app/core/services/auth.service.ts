import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public usuarioActual: Usuario | null = null;

  constructor(private supabaseService: SupabaseService) {}

  async login(email: string, password: string) {

    const { data, error } =
      await this.supabaseService.client.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      throw error;
    }

    if (data.user) {
      this.usuarioActual = await this.obtenerPerfil(data.user.id);
    }

    return data;
  }

  async obtenerPerfil(uid: string): Promise<Usuario | null> {
    
    const { data, error } =
      await this.supabaseService.client
        .from('usuarios')
        .select('*')
        .eq('id', uid)
        .single();

    if (error) {
      console.error('Error al obtener perfil:', error);
      return null;
    }

    return data as Usuario;
  }

  async logout() {

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

    // 1. Crear usuario en Supabase Auth
    const { data, error } =
      await this.supabaseService.client.auth.signUp({
        email: datos.email,
        password: datos.password,
        options: {
          data: {
            apellido: datos.apellido,
            nombre: datos.nombre,
            dni: datos.dni
          }
        }
      });

    if (error) {
      throw error;
    }

    // Verificar que Supabase haya creado el usuario
    if (!data.user) {
      throw new Error('No se pudo crear el usuario.');
    }

    return data;
  }


}
