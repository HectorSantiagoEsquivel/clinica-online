import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../auth/auth.service';
import { EspecialidadService } from '../../shared/services/especialidad.service';
import { HorariosService } from '../services/horarios.service';
import { TurnosService } from '../../shared/services/turno.service';

import { Usuario } from '../../shared/models/usuario.model';
import { Horario } from '../../shared/models/horario.model';
import { Turno } from '../../shared/models/turno';
import { SpinnerDirective } from '../../shared/directives/spinner.directive';
import { CaptchaDirective } from '../../shared/directives/captcha.directive';

@Component({
  selector: 'app-solicitar-turnos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,SpinnerDirective,CaptchaDirective],
  templateUrl: './solicitar-turnos.component.html',
  styleUrls: ['./solicitar-turnos.component.scss'],
})
export class SolicitarTurnoComponent implements OnInit {
  pacientes: Usuario[] = [];
  pacienteSeleccionado?: Usuario;
  esAdmin = false;
  cargando=true;
  esCaptchaValido: boolean = false;
  mostrarCaptcha = true;

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
    this.cargando = true;
    this.especialidades = [];
    this.especialistas = await this.authService.traerUsuariosPorPerfil('especialista');
    const user = await this.authService.getUserProfile();
    this.esAdmin = user.rol === 'admin';

    if (this.esAdmin) {
      this.pacientes = await this.authService.traerUsuariosPorPerfil('paciente');
    }

    this.cargando = false;
  }



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


  async onEspecialidadChange() {
    this.diaSeleccionado = '';
    this.horaSeleccionada = '';
    this.horariosDisponibles = [];


    if (this.especialistaSeleccionado) {
      await this.generarDiasConTurnosDisponibles();
    }
  }


  async onEspecialistaChange() {
    this.diaSeleccionado = '';
    this.horaSeleccionada = '';
    this.horariosDisponibles = [];
    this.especialidades = await firstValueFrom(
      this.especialidadService.obtenerEspecialidadesPorEspecialista(this.especialistaSeleccionado!.id)
    );
    this.diasProximos = [];
  }


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


  calcularSlotsParaDia(
    diaStr: string,
    horarios: Horario[],
    turnosOcupados: Turno[]
  ): string[] {

    const [año, mes, dia] = diaStr.split('-').map((v) => Number(v));
    const fechaLocal = new Date(año, mes - 1, dia);


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
    if (this.mostrarCaptcha && !this.esCaptchaValido) 
      {
      Swal.fire('Captcha incorrecto', 'Resuelva el captcha antes de continuar.', 'warning');
      return;
    }
    this.cargando=true;

    
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
    this.cargando=false;
  }
}
