import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { AuthService } from '../../auth/auth.service';
import { EspecialidadService } from '../../shared/services/especialidad.service';
import { HorariosService } from '../services/horarios.service';
import { TurnosService } from '../../shared/services/turno.service';

import { Usuario } from '../../shared/models/usuario.model';
import { Horario } from '../../shared/models/horario.model';
import { Turno } from '../../shared/models/turno';

@Component({
  selector: 'app-solicitar-turnos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './solicitar-turnos.component.html',
  styleUrls: ['./solicitar-turnos.component.scss'],
})
export class SolicitarTurnoComponent implements OnInit {
  pacientes: Usuario[] = [];
  pacienteSeleccionado?: Usuario;
  esAdmin = false;

  especialidades: any[] = [];
  especialistas: Usuario[] = [];
  especialistaSeleccionado?: Usuario;
  especialidadSeleccionadaNombre = '';
  especialidadSeleccionadaId = '';

  diasProximos: string[] = [];
  diaSeleccionado = '';
  horariosDisponibles: string[] = [];
  horaSeleccionada = '';

  constructor(
    private authService: AuthService,
    private especialidadService: EspecialidadService,
    private horariosService: HorariosService,
    private turnosService: TurnosService
  ) {}

  async ngOnInit() {
    // 1) traigo especialidades
    this.especialidades = await this.especialidadService.getEspecialidades();

    // 2) genero próximos 15 días en local
    this.generarProximosDias();

    // 3) determino si es admin y cargo pacientes
    const user = await this.authService.getUserProfile();
    this.esAdmin = user.rol === 'admin';
    if (this.esAdmin) {
      this.pacientes = await this.authService.traerUsuariosPorPerfil('paciente');
    }
  }

  /** Genera 15 fechas YYYY-MM-DD en hora local */
  generarProximosDias() {
    const hoy = new Date();
    this.diasProximos = [];

    for (let i = 0; i < 15; i++) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha.getDate()).padStart(2, '0');
      this.diasProximos.push(`${año}-${mes}-${dia}`);
    }
  }

  /** Cuando elijo una especialidad */
  async onEspecialidadChange() {
    this.especialistaSeleccionado = undefined;
    this.diaSeleccionado = '';
    this.horaSeleccionada = '';
    this.horariosDisponibles = [];
    this.diasProximos = [];

    // cargo todos los especialistas (luego podés filtrar por especialidad)
    this.especialistas = await this.authService.traerUsuariosPorPerfil('especialista');
  }

  /** Cuando elijo un especialista */
  async onEspecialistaChange() {
    this.diaSeleccionado = '';
    this.horaSeleccionada = '';
    this.horariosDisponibles = [];
    await this.generarDiasConTurnosDisponibles();
  }

  /** Cuando pulso sobre un día */
  async onDiaSeleccionado(diaStr: string) {
    this.diaSeleccionado = diaStr;

    const horarios = await this.horariosService.obtenerHorariosPorEspecialista(
      this.especialistaSeleccionado!.id
    );
    const turnosOcupados = await this.turnosService.obtenerTurnosFiltrados({
      especialistaId: this.especialistaSeleccionado!.id,
      fecha: diaStr,
      estados: ['pendiente', 'aceptado', 'realizado'],
    });

    this.horariosDisponibles = this.calcularSlotsParaDia(
      diaStr,
      horarios,
      turnosOcupados
    );
  }

  /**
   * Calcula las franjas horarias disponibles:
   * - convierte `diaStr` a Date local
   * - filtra horarios por día y especialidad
   * - build slots evitando horas ocupadas
   */
  calcularSlotsParaDia(
    diaStr: string,
    horarios: Horario[],
    turnosOcupados: Turno[]
  ): string[] {
    // parseo local de la fecha
    const [año, mes, dia] = diaStr.split('-').map((v) => Number(v));
    const fechaLocal = new Date(año, mes - 1, dia);

    // nombre del día en local
    const diasSemana = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];
    const nombreDia = diasSemana[fechaLocal.getDay()];

    // horas ya ocupadas
    const horasOcupadas = turnosOcupados.map((t) =>
      new Date(t.fecha).toTimeString().slice(0, 5)
    );

    const slots: string[] = [];
    horarios
      .filter(
        (h) =>
          h.dia === nombreDia &&
          h.especialidad === this.especialidadSeleccionadaNombre
      )
      .forEach((h) => {
        let cursor = this.parseHora(h.horaInicio);
        const fin = this.parseHora(h.horaFin);
        while (cursor < fin) {
          const str = this.formatearHora(cursor);
          if (!horasOcupadas.includes(str)) {
            slots.push(str);
          }
          cursor = new Date(cursor.getTime() + h.duracion * 60000);
        }
      });

    return slots;
  }

  /** Prepara `diasProximos` filtrando sólo fechas con slots > 0 */
  async generarDiasConTurnosDisponibles() {
    if (!this.especialistaSeleccionado) {
      this.diasProximos = [];
      return;
    }
    const horarios = await this.horariosService.obtenerHorariosPorEspecialista(
      this.especialistaSeleccionado.id
    );
    const base = new Date();
    this.diasProximos = [];

    for (let i = 0; i < 15; i++) {
      const fecha = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate() + i
      );
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha.getDate()).padStart(2, '0');
      const diaStr = `${año}-${mes}-${dia}`;

      const ocupados = await this.turnosService.obtenerTurnosFiltrados({
        especialistaId: this.especialistaSeleccionado.id,
        fecha: diaStr,
        estados: ['pendiente', 'aceptado', 'realizado'],
      });
      const slots = this.calcularSlotsParaDia(diaStr, horarios, ocupados);
      if (slots.length) {
        this.diasProximos.push(diaStr);
      }
    }
  }

    /**
   * Dada una cadena 'YYYY-MM-DD', devuelve el nombre del día en español.
   */
  obtenerNombreDia(fecha: string): string {
    const dias = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];
    const [año, mes, dia] = fecha.split('-').map(Number);
    // Creamos la fecha en local, sin desfase UTC
    const d = new Date(año, mes - 1, dia);
    return dias[d.getDay()];
  }


  parseHora(h: string): Date {
    const [hh, mm] = h.split(':').map((v) => Number(v));
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    return d;
  }

  formatearHora(d: Date): string {
    return d.toTimeString().slice(0, 5);
  }

  async reservarTurno() {
    if (!this.diaSeleccionado || !this.horaSeleccionada) {
      Swal.fire('Faltan datos', 'Por favor seleccioná día y horario.', 'error');
      return;
    }

    let paciente: Usuario;
    if (this.esAdmin) {
      if (!this.pacienteSeleccionado) {
        Swal.fire('Faltan datos', 'Seleccioná un paciente.', 'error');
        return;
      }
      paciente = this.pacienteSeleccionado;
    } else {
      paciente = await this.authService.getUserProfile();
    }

    // armo ISO en UTC desde local
    const [año, mes, dia] = this.diaSeleccionado.split('-').map(Number);
    const [hh, mm] = this.horaSeleccionada.split(':').map(Number);
    const fechaLocal = new Date(año, mes - 1, dia, hh, mm);
    const iso = fechaLocal.toISOString();

    try {
      await this.turnosService.crearTurno({
        especialistaId: this.especialistaSeleccionado!.id,
        pacienteId: paciente.id,
        especialidadId: this.especialidadSeleccionadaId,
        fecha: iso,
        estado: 'pendiente',
      });
      Swal.fire({
        icon: 'success',
        title: 'Turno reservado',
        confirmButtonText: 'Ir al inicio',
      }).then(() => (window.location.href = '/home'));
    } catch (e: any) {
      Swal.fire('Error', 'No se pudo reservar el turno.', 'error');
    }
  }
}
