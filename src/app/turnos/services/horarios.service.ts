import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Horario } from '../../shared/models/horario.model';

@Injectable({
  providedIn: 'root'
})
export class HorariosService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = new SupabaseClient(
      environment.apiUrl,
      environment.publicAnonKey
    );
  }

  async obtenerHorariosPorEspecialista(idEspecialista: string): Promise<Horario[]> {
    const { data, error } = await this.supabase
      .from('horarios')
      .select('horarios')
      .eq('id_especialista', idEspecialista)
      .single();

    if (error) {
      console.error('Error al obtener horarios:', error);
      return [];
    }

    return data?.horarios || [];
  }

  async guardarHorarios(idEspecialista: string, horarios: Horario[]) {
    const { data: existente, error: findError } = await this.supabase
      .from('horarios')
      .select('*')
      .eq('id_especialista', idEspecialista)
      .single();

    if (findError || !existente) {
      // Insertar nuevo
      const { error: insertError } = await this.supabase
        .from('horarios')
        .insert([{ id_especialista: idEspecialista, horarios }]);

      if (insertError) {
        console.error('Error al insertar horarios:', insertError);
      }
    } else {
      // Actualizar existente
      const { error: updateError } = await this.supabase
        .from('horarios')
        .update({ horarios })
        .eq('id_especialista', idEspecialista);

      if (updateError) {
        console.error('Error al actualizar horarios:', updateError);
      }
    }
  }
}
