import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BotonMenu } from '../models/boton-menu.model';

interface BotonMenuRow {
  id: number;
  clave: string;
  titulo: string;
  icono: string;
  ruta: string | null;
  orden: number;
  activo: boolean;
  rol_botones: { rol_id: number; contexto: string }[] | null;
}

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private supabaseService = inject(SupabaseService);

  async getBotonesPorRol(rolId: number): Promise<BotonMenu[]> {
    const { data, error } = await this.supabaseService.client
      .from('botones_menu')
      .select('id, clave, titulo, icono, ruta, orden, activo, rol_botones!inner(rol_id, contexto)')
      .eq('rol_botones.rol_id', rolId)
      .eq('activo', true)
      .order('orden');

    if (error) {
      console.error('Error al obtener los botones del menú:', error);
      return [];
    }

    return ((data ?? []) as BotonMenuRow[]).map((fila) => ({
      id: fila.id,
      clave: fila.clave,
      titulo: fila.titulo,
      icono: fila.icono,
      ruta: fila.ruta,
      orden: fila.orden,
      activo: fila.activo,
      contexto: fila.rol_botones?.[0]?.contexto ?? 'siempre',
    }));
  }
}
