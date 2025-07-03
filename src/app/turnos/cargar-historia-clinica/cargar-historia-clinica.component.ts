import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

import { HistoriaClinicaService } from '../../shared/services/historia.service';
import { AuthService } from '../../auth/auth.service';
import { Usuario } from '../../shared/models/usuario.model';
import { CommonModule } from '@angular/common';
import { TurnosService } from '../../shared/services/turno.service';
import { SpinnerDirective } from '../../shared/directives/spinner.directive';

@Component({
  selector: 'app-cargar-historia-clinica',
  templateUrl: './cargar-historia-clinica.component.html',
  styleUrls: ['./cargar-historia-clinica.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule,SpinnerDirective]
})
export class CargarHistoriaClinicaComponent implements OnInit {
  historiaClinicaForm: FormGroup;
  turnoId?: string;
  pacienteId?: string;
  usuarioActual?: Usuario;
  cargando=true;

  constructor(
    private historiaService: HistoriaClinicaService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private turnoService: TurnosService
  ) {
    this.historiaClinicaForm = new FormGroup({
      altura: new FormControl('', [Validators.required, Validators.min(15), Validators.max(250)]),
      peso: new FormControl('', [Validators.required, Validators.min(0), Validators.max(400)]),
      temperatura: new FormControl('', [Validators.required, Validators.min(32), Validators.max(50)]),
      presion: new FormControl('', [Validators.required]),
      campoDinamicoClave1: new FormControl(''),
      campoDinamicoValor1: new FormControl(''),
      campoDinamicoClave2: new FormControl(''),
      campoDinamicoValor2: new FormControl(''),
      campoDinamicoClave3: new FormControl(''),
      campoDinamicoValor3: new FormControl(''),
      resena: new FormControl('', Validators.required) // ✅ agregado aquí
    });
  }

  ngOnInit(): void {
    this.cargando=true;
    this.turnoId = this.route.snapshot.paramMap.get('turnoId') || '';
    this.pacienteId = this.route.snapshot.paramMap.get('pacienteId') || '';
    this.authService.getUserProfile()
      .then(usuario => this.usuarioActual = usuario)
      .catch(error => console.error('Error al cargar usuario:', error));
    this.cargando=false;
  }

  async finalizarTurno() {
    this.cargando=true;
    if (!this.pacienteId || !this.usuarioActual?.id || !this.turnoId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Faltan datos obligatorios para guardar la historia clínica.'
      });
      return;
    }

    const form = this.historiaClinicaForm.value;

    // Cargar dinámicamente los campos adicionales
    const datosAdicionales: { [clave: string]: any } = {};
    for (let i = 1; i <= 3; i++) {
      const clave = form[`campoDinamicoClave${i}`];
      const valor = form[`campoDinamicoValor${i}`];
      if (clave && valor) {
        datosAdicionales[clave] = valor;
      }
    }

    const historia = {
      paciente_id: this.pacienteId,
      especialista_id: this.usuarioActual.id,
      turno_id: this.turnoId,
      altura: form.altura,
      peso: form.peso,
      temperatura: form.temperatura,
      presion: form.presion,
      datos_adicionales: datosAdicionales
    };
    this.cargando=false;
    try {
      // 1. Guardar historia clínica
      await this.historiaService.crearHistoriaClinica(historia);

      // 2. Finalizar turno con reseña (tomada del form)
      await this.turnoService.finalizarTurno(this.turnoId, form.resena);
      console.log('Reseña enviada:', form.resena);

      Swal.fire({
        icon: 'success',
        title: 'Historia clínica guardada',
        text: 'El turno fue finalizado y la historia clínica registrada.'
      });

      this.router.navigateByUrl('/mis-turnos-especialista');
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo guardar la historia clínica ni finalizar el turno.'
      });
    }

  }
}
