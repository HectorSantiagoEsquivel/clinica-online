import { Component, OnInit } from '@angular/core';
import { HistoriaClinicaService } from '../../services/historia.service';
import { AuthService } from '../../../auth/auth.service';
import { HistoriaClinica } from '../../models/historia.model';
import { Usuario } from '../../models/usuario.model';
import { TurnosService } from '../../services/turno.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EspecialidadService } from '../../../shared/services/especialidad.service';

@Component({
  selector: 'app-historia-clinica-paciente',
  templateUrl: './historia-clinica-paciente.component.html',
  styleUrls: ['./historia-clinica-paciente.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class HistoriaClinicaPacienteComponent implements OnInit {
  historias: {
    historia: HistoriaClinica;
    resena: string;
    fechaTurno: string;
    especialidad: string;
    especialistaNombre: string;
    pacienteNombre: string;
  }[] = [];

  usuarioActual?: Usuario;
  cargando: boolean = true;

  objectKeys = Object.keys;

  constructor(
    private historiaService: HistoriaClinicaService,
    private authService: AuthService,
    private turnosService: TurnosService,
    private especialidadService: EspecialidadService
  ) {}

  async ngOnInit() {
    try {
      this.usuarioActual = await this.authService.getUserProfile();
      if (!this.usuarioActual) return;

      const historias = await this.historiaService.obtenerHistoriaPorPaciente(this.usuarioActual.id);
      const turnos = await this.turnosService.obtenerTurnosFiltrados({ pacienteId: this.usuarioActual.id });

      const usuarios = new Map<string, Usuario>();
      const especialidades = new Map<string, string>();

      // Cargar todos los especialistas que aparecen en los turnos
      for (const turno of turnos) {
        if (!usuarios.has(turno.especialistaId)) 
        {
          const especialista = await this.authService.obtenerUsuarioPorId(turno.especialistaId);
          usuarios.set(turno.especialistaId, especialista);
        }   
        if (!especialidades.has(turno.especialidadId)) 
          {
          const especialidad = await this.especialidadService.obtenerEspecialidadPorId(turno.especialidadId);
          especialidades.set(turno.especialidadId, especialidad.nombre);
        }

      }

      this.historias = historias.map(historia => {
        const turno = turnos.find(t => t.id === historia.turno_id);
        const especialista = turno ? usuarios.get(turno.especialistaId) : null;
        const especialidad = turno ? especialidades.get(turno.especialidadId) : null;

        return {
          historia,
          resena: turno?.resena ?? 'Sin reseña',
          fechaTurno: turno ? new Date(turno.fecha).toLocaleDateString() : 'Fecha desconocida',
          especialidad: especialidad ?? 'Especialidad desconocida',
          especialistaNombre: especialista ? `${especialista.nombre} ${especialista.apellido}` : 'Desconocido',
          pacienteNombre: `${this.usuarioActual?.nombre} ${this.usuarioActual?.apellido}`
        };
      });

    } catch (error) {
      console.error('Error al cargar historias clínicas:', error);
    } finally {
      this.cargando = false;
    }
  }
}
