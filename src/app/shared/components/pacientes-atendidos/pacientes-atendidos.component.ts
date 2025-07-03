import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../auth/auth.service';
import { TurnosService } from '../../services/turno.service';
import { Usuario } from '../../models/usuario.model';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pacientes-atendidos',
  templateUrl: './pacientes-atendidos.component.html',
  styleUrls: ['./pacientes-atendidos.component.scss'],
  imports:[CommonModule]
})
export class PacientesAtendidosComponent implements OnInit {
  pacientes: Usuario[] = [];
  cargando: boolean = true;

  constructor(
    private authService: AuthService,
    private turnosService: TurnosService,
    private router:Router
  ) {}

  async ngOnInit() {
    try {
      const usuarioActual = await this.authService.getUserProfile();
      if (!usuarioActual || usuarioActual.rol !== 'especialista') return;

      const turnos = await this.turnosService.obtenerTurnosFiltrados({
        especialistaId: usuarioActual.id,
        estado: 'finalizado' // o 'completado', según tu sistema
      });

      const pacientesUnicos = new Set(turnos.map(t => t.pacienteId));
      const pacientesCargados: Usuario[] = [];

      for (const pacienteId of pacientesUnicos) {
        try {
          const paciente = await this.authService.obtenerUsuarioPorId(pacienteId);
          pacientesCargados.push(paciente);
        } catch (error) {
          console.warn(`Error cargando paciente ${pacienteId}:`, error);
        }
      }

      this.pacientes = pacientesCargados;
    } catch (error) {
      console.error('Error cargando pacientes atendidos:', error);
    } finally {
      this.cargando = false;
    }
  }
  verHistoria(paciente: Usuario) {
    this.router.navigate(['/historia-clinica', paciente.id]);
  }

}
