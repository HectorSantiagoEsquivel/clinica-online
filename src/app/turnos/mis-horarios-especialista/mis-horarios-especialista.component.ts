import { Component, OnInit } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Usuario } from "../../shared/models/usuario.model";
import { Horario } from "../../shared/models/horario.model";
import { AuthService } from "../../auth/auth.service";
import { HorariosService } from "../services/horarios.service";
import { EspecialidadService } from '../../shared/services/especialidad.service';

@Component({
  selector: 'app-mis-horarios-especialista',
  templateUrl: './mis-horarios-especialista.component.html',
  styleUrl: './mis-horarios-especialista.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MisHorariosEspecialistaComponent implements OnInit {
  usuario?: Usuario;
  especialidades: string[] = [];
  horarios: Horario[] = [];
  nuevoHorario: Horario = new Horario('', 0, '', '', '');

  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  tabActiva: 'listar' | 'agregar' = 'listar';

  constructor(
    private authService: AuthService,
    private horariosService: HorariosService,
    private especialidadService: EspecialidadService
  ) {}

  async ngOnInit() {
    this.usuario = await this.authService.getUserProfile();
    this.especialidadService.obtenerEspecialidadesPorEspecialista(this.usuario.id)
    .subscribe(data => {
      this.especialidades = data.map((e: any) => e.nombre);
    });
    this.cargarHorarios();
  }

  async cargarHorarios() {
    if (this.usuario) {
      this.horarios = await this.horariosService.obtenerHorariosPorEspecialista(this.usuario.id);
    }
  }

  agregarHorario() {
    if (!this.usuario) return;
    this.horarios.push({...this.nuevoHorario});
    this.guardarHorarios();
    this.nuevoHorario = new Horario('', 0, '', '', '');
    this.tabActiva = 'listar';
  }

  eliminarHorario(index: number) {
    this.horarios.splice(index, 1);
    this.guardarHorarios();
  }

  guardarHorarios() {
    if (this.usuario) {
      this.horariosService.guardarHorarios(this.usuario.id, this.horarios);
    }
  }
}
