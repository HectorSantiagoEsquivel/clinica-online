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

  async crearTurno(turno: Partial<Turno>): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.tabla)
      .insert([turno]);

    if (error) throw error;
  }

  async calificarAtencion(turnoId: string, puntaje: number, comentario: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.tabla)
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

  async obtenerTurnosFiltrados(filtros: any): Promise<Turno[]> 
  {
    let query = this.supabase.client
      .from(this.tabla)
      .select('*');

    if (filtros.especialistaId) query = query.eq('especialistaId', filtros.especialistaId);
    
    if (filtros.fecha) {
      // Convertir a fecha local en el cliente
      const fechaInicio = new Date(`${filtros.fecha}T00:00:00`);
      const fechaFin = new Date(`${filtros.fecha}T23:59:59`);
      
      query = query.gte('fecha', fechaInicio.toISOString())
                  .lt('fecha', fechaFin.toISOString());
    }

    if (filtros.estados) query = query.in('estado', filtros.estados);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
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

  async aceptarTurno(turnoId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.tabla)
      .update({ estado: 'aceptado' })
      .eq('id', turnoId);

    if (error) throw error;
  }

  async finalizarTurno(turnoId: string, resena: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.tabla)
      .update({
        estado: 'realizado',
        resena: resena
      })
      .eq('id', turnoId);

    if (error) throw error;
  }

  async getTurnosPorEspecialidad(): Promise<{ especialidad: string, cantidad: number }[]> {
    const { data, error } = await this.supabase.client
      .from('turnos')
      .select('especialidadId')
      .not('especialidadId', 'is', null);

    if (error) throw error;

    const conteo = new Map<string, number>();
    for (const turno of data) {
      const espId = turno.especialidadId;
      conteo.set(espId, (conteo.get(espId) || 0) + 1);
    }

    const resultados: { especialidad: string, cantidad: number }[] = [];
    for (const [id, cantidad] of conteo.entries()) {
      const { data: esp, error: errEsp } = await this.supabase.client
        .from('especialidades')
        .select('nombre')
        .eq('id', id)
        .single();

      if (errEsp || !esp) {
        console.warn(`No se encontró la especialidad con ID: ${id}`);
        continue;
      }

      resultados.push({
        especialidad: esp.nombre,
        cantidad
      });
    }

    return resultados;
  }


  async getTurnosPorDia(): Promise<{ fecha: string, cantidad: number }[]> {
    const { data, error } = await this.supabase.client
      .from('turnos')
      .select('fecha');

    if (error) throw error;

    const conteo = new Map<string, number>();
    for (const row of data) {
      const fecha = new Date(row.fecha).toISOString().split('T')[0];
      conteo.set(fecha, (conteo.get(fecha) || 0) + 1);
    }

    return Array.from(conteo.entries()).map(([fecha, cantidad]) => ({ fecha, cantidad }));
  }

async getTurnosPorMedico(desde: string, hasta: string): Promise<{ medico: string, cantidad: number }[]> {
  const { data, error } = await this.supabase.client
    .from('turnos')
    .select('especialistaId, usuarios:especialistaId(nombre, apellido)')
    .gte('fecha', desde)
    .lte('fecha', hasta);

  if (error) throw error;

  const conteo = new Map<string, { nombre: string, apellido: string, cantidad: number }>();

  for (const row of data) {
    const id = row.especialistaId;
    const medico = Array.isArray(row.usuarios) ? row.usuarios[0] : row.usuarios;
    if (!medico) continue;

    if (conteo.has(id)) {
      conteo.get(id)!.cantidad += 1;
    } else {
      conteo.set(id, {
        nombre: medico.nombre,
        apellido: medico.apellido,
        cantidad: 1
      });
    }
  }

  return Array.from(conteo.values()).map(({ nombre, apellido, cantidad }) => ({
    medico: `${nombre} ${apellido}`,
    cantidad
  }));
}


async getTurnosFinalizadosPorMedico(desde: string, hasta: string): Promise<{ medico: string, cantidad: number }[]> {
  const { data, error } = await this.supabase.client
    .from('turnos')
    .select('especialistaId, usuarios:especialistaId(nombre, apellido)')
    .eq('estado', 'realizado')
    .gte('fecha', desde)
    .lte('fecha', hasta);

  if (error) throw error;

  const conteo = new Map<string, { nombre: string, apellido: string, cantidad: number }>();

  for (const row of data) {
    const id = row.especialistaId;
    const medico = Array.isArray(row.usuarios) ? row.usuarios[0] : row.usuarios;
    if (!medico) continue;

    if (conteo.has(id)) {
      conteo.get(id)!.cantidad += 1;
    } else {
      conteo.set(id, {
        nombre: medico.nombre,
        apellido: medico.apellido,
        cantidad: 1
      });
    }
  }

  return Array.from(conteo.values()).map(({ nombre, apellido, cantidad }) => ({
    medico: `${nombre} ${apellido}`,
    cantidad
  }));
}


}
