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

    return Promise.all(data.map(esp => this.cargarImagenEspecialidad(esp)));
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
    const query = this.supabase.client
      .from('especialista_especialidades')
      .select('especialidad:especialidad_id (id, nombre)')
      .eq('especialista_id', especialistaId);

    const promesa = query.then(async ({ data, error }) => {
      if (error) throw error;
      const especialidades = data?.map(item => item.especialidad) || [];
      const especialidadesConImagen = await Promise.all(
        especialidades.map(esp => this.cargarImagenEspecialidad(esp))
      );

      return especialidadesConImagen;
    });

    return from(promesa);
  }

  async cargarImagenEspecialidad(especialidad: any): Promise<any> {
    const carpeta = `especialidades/${especialidad.id}-${especialidad.nombre}`;
    const { data: imagen } = this.supabase.client.storage
      .from('imagenes')
      .getPublicUrl(`${carpeta}/imagen.png`);

    return {
      ...especialidad,
      imagen_url: imagen.publicUrl || 'assets/especialidades/default.png'
    };
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
