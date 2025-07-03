import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from,Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EspecialidadService {
  constructor(private supabase: SupabaseService) {}


  async getEspecialidades(): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('especialidades')
      .select('*');
    if (error) throw error;
    return data;
  }


  async crearEspecialidad(nombre: string, creada_por: string): Promise<any> {
    const { data, error } = await this.supabase.client
      .from('especialidades')
      .insert([{ nombre, creada_por }])
      .select()
      .single();
    if (error) throw error;
    return data; 
  }

    obtenerEspecialidadesPorEspecialista(especialistaId: string): Observable<any[]> {
    // Supabase permite hacer selects con joins usando la sintaxis de objetos anidados
    const query = this.supabase.client
      .from('especialista_especialidades')
      .select('especialidad:especialidad_id (id, nombre)')
      .eq('especialista_id', especialistaId);

    const promesa = query.then(({ data, error }) => {
      if (error) throw error;
      // Extraemos solo la parte de especialidad (el array puede contener objetos con clave 'especialidad')
      return data?.map(item => item.especialidad) || [];
    });

    return from(promesa);
  }

  async obtenerEspecialidadPorId(id: string): Promise<{ id: string, nombre: string }> 
  {
    const { data, error } = await this.supabase.client
      .from('especialidades')
      .select('id, nombre')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

}
