import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { HistoriaClinica } from '../models/historia.model';

@Injectable({
  providedIn: 'root'
})
export class HistoriaClinicaService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.apiUrl,
      environment.publicAnonKey
    );
  }

  async crearHistoriaClinica(historia: HistoriaClinica) {
    const { data, error } = await this.supabase
      .from('historia_clinica')
      .insert(historia)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async obtenerHistoriaPorPaciente(pacienteId: string) {
    const { data, error } = await this.supabase
      .from('historia_clinica')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha_creacion', { ascending: false });
    if (error) throw error;
    return data;
    }

    async obtenerPorTurno(turnoId: string) {
        const { data, error } = await this.supabase
        .from('historia_clinica')
        .select('*')
        .eq('turno_id', turnoId)
        .order('fecha_creacion', { ascending: false });
        if (error) throw error;
        return data;
    }

  async obtenerHistoriaPorEspecialista(especialistaId: string) {
    const { data, error } = await this.supabase
      .from('historia_clinica')
      .select('*')
      .eq('especialista_id', especialistaId)
      .order('fecha_creacion', { ascending: false });
    if (error) throw error;
    return data;
  }
}
