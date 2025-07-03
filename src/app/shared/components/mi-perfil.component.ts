import { Component, OnInit } from '@angular/core';
import { Usuario } from '../../shared/models/usuario.model';
import { AuthService } from '../../auth/auth.service';
import { EspecialidadService } from '../../shared/services/especialidad.service';
import { CommonModule } from '@angular/common';
import { MisHorariosEspecialistaComponent } from '../../turnos/mis-horarios-especialista/mis-horarios-especialista.component';
import { HistoriaClinicaPacienteComponent } from './historia-clinica-paciente/historia-clinica-paciente.component';
import { SpinnerDirective } from '../directives/spinner.directive';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [
    CommonModule,
    SpinnerDirective,
    MisHorariosEspecialistaComponent,
    HistoriaClinicaPacienteComponent
  ],
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.scss'],
})
export class MiPerfilComponent implements OnInit {
  usuario?: Usuario | null;
  especialidades: { id: string; nombre: string }[] = [];
  tabActivo: 'perfil' | 'historia' = 'perfil';
  cargando = false;

  constructor(
    private authService: AuthService,
    private especialidadService: EspecialidadService
  ) {}

  async ngOnInit(): Promise<void> {
    this.cargando = true;
    try {
      // 1) Obtener perfil
      this.usuario = await this.authService.getUserProfile();

      // 2) Si es especialista, obtener sus especialidades
      if (this.usuario?.rol === 'especialista') {
        this.especialidades = await firstValueFrom(
          this.especialidadService
            .obtenerEspecialidadesPorEspecialista(this.usuario.id)
        );
      }
    } catch (error: any) {
      console.error('Error cargando perfil:', error);
    } finally {
      // 3) Apagar spinner
      this.cargando = false;
    }
  }

  calcularEdad(fechaNacimiento?: Date): number | string {
    if (!fechaNacimiento) return 'N/D';
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
      edad--;
    }
    return edad;
  }
}
