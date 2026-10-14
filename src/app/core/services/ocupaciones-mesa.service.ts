
import { Injectable, inject } from '@angular/core';

import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { AnonymousSessionService } from './anonymous-session.service';

@Injectable({
  providedIn: 'root'
})
export class OcupacionesMesaService {

    private readonly supabase = inject(SupabaseService);
    private readonly auth = inject(AuthService);
    private readonly anonymousSession = inject(AnonymousSessionService);

    async obtenerOcupacionAsignada(): Promise<any | null> {
        const usuario = this.auth.usuarioActual;

        if (usuario) {
            const { data, error } = await this.supabase.client
            .from('ocupaciones_mesa')
            .select(`
                *,
                mesas (
                numero
                )
            `)
            .eq('usuario_id', usuario.id)
            .eq('estado', 'asignada')
            .maybeSingle();

            if (error) {
            throw error;
            }

            return data;
        }

        const sesionAnonimaId =
            this.anonymousSession.obtenerIdSesion();

        if (sesionAnonimaId) {
            const { data, error } = await this.supabase.client
            .from('ocupaciones_mesa')
            .select(`
                *,
                mesas (
                numero
                )
            `)
            .eq('sesion_anonima_id', sesionAnonimaId)
            .eq('estado', 'asignada')
            .maybeSingle();

            if (error) {
            throw error;
            }

            return data;
        }

        return null;
    }


    async validarQrMesa(mesaId: string): Promise<{
        valido: boolean;
        ocupacion: any | null;
    }> {

        const ocupacion = await this.obtenerOcupacionAsignada();

        if (!ocupacion) {
            return {
            valido: false,
            ocupacion: null
            };
        }
        if (ocupacion.mesa_id !== mesaId) {
            return {
            valido: false,
            ocupacion
            };
        }
        return {
            valido: true,
            ocupacion
        };
    }


    async activarOcupacion(ocupacionId: number): Promise<void> {
        const { error } = await this.supabase.client
            .from('ocupaciones_mesa')
            .update({
            estado: 'activa',
            fecha_ingreso: new Date().toISOString()
            })
            .eq('id', ocupacionId)
            .eq('estado', 'asignada');

        if (error) {
            throw error;
        }
    }

    async confirmarIngresoAMesa(mesaId: string): Promise<{
        tipo: 'exito' | 'error' | 'sin_asignacion';
        ocupacion: any | null;
    }> {
        const resultado = await this.validarQrMesa(mesaId);

        if (!resultado.ocupacion) {
            return {
            tipo: 'sin_asignacion',
            ocupacion: null
            };
        }

        if (!resultado.valido) {
            return {
            tipo: 'error',
            ocupacion: resultado.ocupacion
            };
        }

        await this.activarOcupacion(resultado.ocupacion.id);

        const usuario = this.auth.usuarioActual;

        if (usuario) {
            await this.auth.actualizarEstadoEstadia('en_mesa');
        } else {
            const sesionAnonimaId = this.anonymousSession.obtenerIdSesion();

            if (sesionAnonimaId) {
            await this.anonymousSession.actualizarEstado('en_mesa');
            }
        }

        return {
            tipo: 'exito',
            ocupacion: resultado.ocupacion
        };
    }

}

