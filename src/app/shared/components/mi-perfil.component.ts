import { Component, OnInit } from '@angular/core';
import { Usuario } from '../../shared/models/usuario.model';
import { AuthService } from '../../auth/auth.service';
import { EspecialidadService } from '../../shared/services/especialidad.service'; // Servicio para traer especialidades
import { CommonModule } from '@angular/common';
import { MisHorariosEspecialistaComponent } from '../../turnos/mis-horarios-especialista/mis-horarios-especialista.component';

@Component({
  selector: 'app-mi-perfil',
  templateUrl: './mi-perfil.component.html',
  imports: [CommonModule, MisHorariosEspecialistaComponent],
  styleUrls: ['./mi-perfil.component.scss'],
})
export class MiPerfilComponent implements OnInit {
  usuario?: Usuario | null;
  especialidades: { id: string; nombre: string }[] = [];

  constructor(
    private authService: AuthService,
    private especialidadService: EspecialidadService
  ) {}

  ngOnInit(): void {
    this.cargarUsuario();
  }

  cargarUsuario() {
    this.authService.getUserProfile().then((user) => {
      this.usuario = user; // acá sí es un Usuario completo

      if (this.usuario?.rol === 'especialista') {
        this.cargarEspecialidades(this.usuario.id);
      }
    });
  }


  cargarEspecialidades(especialistaId: string) {
    this.especialidadService
      .obtenerEspecialidadesPorEspecialista(especialistaId)
      .subscribe((especialidades) => {
        this.especialidades = especialidades;
      });
  }

  calcularEdad(fechaNacimiento?: Date): number | string {
    if (!fechaNacimiento) return 'N/D';

    const hoy = new Date();
    const fecha = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const m = hoy.getMonth() - fecha.getMonth();

    if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) {
      edad--;
    }

    return edad;
  }
}
