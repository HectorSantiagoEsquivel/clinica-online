import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Turno } from '../models/turno';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TurnosService {
  private tabla = 'turnos';

  constructor(private supabase: SupabaseService) {}

  obtenerTurnos(
    usuarioId?: string,
    rol?: 'paciente' | 'especialista' | 'admin',
    filtros?: any
  ): Observable<Turno[]> {
    let query = this.supabase.client.from(this.tabla).select(`
      *,
      paciente:pacienteId ( nombre, apellido ),
      especialidad:especialidadId ( nombre ),
      especialista:especialistaId ( nombre, apellido )
    `);

    if (usuarioId && rol && rol !== 'admin') {
      if (rol === 'paciente') {
        query = query.eq('pacienteId', usuarioId);
      } else if (rol === 'especialista') {
        query = query.eq('especialistaId', usuarioId);
      }
    }

    if (filtros) {
      if (filtros.especialidadId) query = query.eq('especialidadId', filtros.especialidadId);
      if (filtros.especialistaId) query = query.eq('especialistaId', filtros.especialistaId);
      if (filtros.pacienteId) query = query.eq('pacienteId', filtros.pacienteId);
      if (filtros.estado) query = query.eq('estado', filtros.estado);
      if (filtros.fecha) query = query.eq('fecha', filtros.fecha);
    }

    const promesa = query.order('fecha', { ascending: true }).then(({ data, error }) => {
      if (error) throw error;
      return data || [];
    });

    return from(promesa);
  }


  async calificarAtencion(turnoId: string, puntaje: number, comentario: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('turnos')
      .update({
        calificaAtencion: puntaje,
        comentarioCalificacion: comentario
      })
      .eq('id', turnoId);

    if (error) throw error;
  }



  obtenerTurnosPorUsuario(
    usuarioId: string,
    campo: 'pacienteId' | 'especialistaId'
  ): Observable<Turno[]> {
    const promesa = this.supabase.client
      .from(this.tabla)
      .select(`
        *,
        paciente:pacienteId ( nombre, apellido ),
        especialidad:especialidadId ( nombre ),
        especialista:especialistaId ( nombre, apellido )
      `)
      .eq(campo, usuarioId)
      .order('fecha', { ascending: true })
      .then(({ data, error }) => {
        if (error) throw error;
        return data || [];
      });

    return from(promesa);
  }


  async actualizarEstadoConComentario(
    turnoId: string,
    nuevoEstado: 'cancelado' | 'rechazado',
    comentario: string
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.tabla)
      .update({
        estado: nuevoEstado,
        comentarioCancelacion: comentario
      })
      .eq('id', turnoId);

    if (error) throw error;
  }

  async aceptarTurno(turnoId: string): Promise<void> 
  {
    const { error } = await this.supabase.client
      .from(this.tabla)
      .update({ estado: 'aceptado' })
      .eq('id', turnoId);

    if (error) throw error;
  }

  async finalizarTurno(turnoId: string, resena: string): Promise<void> 
  {
    const { error } = await this.supabase.client
      .from(this.tabla)
      .update({
        estado: 'realizado',
        resena: resena
      })
      .eq('id', turnoId);

    if (error) throw error;
  }




}
