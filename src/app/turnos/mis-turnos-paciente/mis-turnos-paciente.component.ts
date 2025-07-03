import { Component, OnDestroy, OnInit } from '@angular/core';
import { TurnosService } from '../../shared/services/turno.service';
import { AuthService } from '../../auth/auth.service';
import { Usuario } from '../../shared/models/usuario.model';
import { Turno } from '../../shared/models/turno';
import { Subscription } from 'rxjs';
import { SpinnerDirective } from '../../shared/directives/spinner.directive';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { HistoriaClinicaService } from '../../shared/services/historia.service';

@Component({
  selector: 'app-mis-turnos-paciente',
  standalone: true,
  imports: [FormsModule, SpinnerDirective, CommonModule],
  templateUrl: './mis-turnos-paciente.component.html',
  styleUrls: ['./mis-turnos-paciente.component.scss'],
})
export class MisTurnosPacienteComponent implements OnInit, OnDestroy {
  usuario?: Usuario;
  turnos: Turno[] = [];
  turnosFiltrados: Turno[] = [];
  filtro: string = '';
  cargando: boolean = false;
  sub?: Subscription;

  constructor(
    private authService: AuthService,
    private turnosService: TurnosService,
    private historiaClinicaService: HistoriaClinicaService,
  ) {}

ngOnInit(): void {
  this.cargando = true;

  this.authService.getUserProfile().then((usuario) => {
    this.usuario = usuario;

    this.sub = this.turnosService
      .obtenerTurnos(usuario.id, 'paciente')
      .subscribe(async (turnos) => {
        // Ordenar turnos por fecha descendente
        this.turnos = turnos.sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );

        // Cargar historia clínica para cada turno
        const cargarHistorias = this.turnos.map(async (turno) => {
          const historias = await this.historiaClinicaService.obtenerPorTurno(turno.id);
          const historia = historias[0];

          // Validar y parsear camposDinamicos si vienen como string
          if (historia && typeof historia.camposDinamicos === 'string') {
            try {
              historia.camposDinamicos = JSON.parse(historia.camposDinamicos);
            } catch {
              historia.camposDinamicos = {}; // fallback
            }
          }

          turno.historiaClinica = historia || undefined;
        });

        await Promise.all(cargarHistorias);

        this.actualizarFiltro('');
        this.cargando = false;
      });
  });
}

  actualizarFiltro(valor: string): void {
    this.filtro = valor.toLowerCase();
    if (this.filtro.length >= 3) {
      this.turnosFiltrados = this.turnos.filter(turno => {
        const textoBase = JSON.stringify(turno).toLowerCase();

        let textoHistoria = '';
        if (turno.historiaClinica) {
          const hc = turno.historiaClinica;
          textoHistoria += `${hc.altura} ${hc.peso} ${hc.temperatura} ${hc.presion || ''}`;

          // Incluir campos dinámicos
          if (hc.datos_adicionales) {
            Object.entries(hc.datos_adicionales).forEach(([key, value]) => {
              textoHistoria += ` ${key} ${value}`;
            });
          }
        }

        const textoCompleto = textoBase + ' ' + textoHistoria.toLowerCase();

        return textoCompleto.includes(this.filtro);
      });
    } else {
      this.turnosFiltrados = [...this.turnos];
    }
  }

  async cancelarTurno(turnoId: string) {
    const { value: comentario } = await Swal.fire({
      title: 'Cancelar turno',
      input: 'text',
      inputPlaceholder: 'Motivo de la cancelación',
      showCancelButton: true,
    });

    if (!comentario) return;

    try {
      await this.turnosService.actualizarEstadoConComentario(turnoId, 'cancelado', comentario);
      Swal.fire('Cancelado', 'El turno fue cancelado correctamente', 'success');
      this.actualizarListado();
    } catch (error: any) {
      Swal.fire('Error', error.message || 'No se pudo cancelar el turno', 'error');
    }
  }

  verResena(resena: string) {
    Swal.fire({
      title: 'Reseña del Especialista',
      text: resena,
      icon: 'info',
    });
  }

async calificarTurno(turno: Turno) {
  const { value: formValues } = await Swal.fire({
    title: 'Calificá la atención',
    html: `
      <div class="swal2-calificacion-container">
        <label for="puntaje">Puntaje del 1 al 10:</label>
        <div class="slider-container">
          <input type="range" id="puntaje" min="1" max="10" value="5">
          <span class="range-value" id="sliderValue">5</span>
        </div>
        
        <label for="comentario" class="comentario-label">Comentario:</label>
        <textarea id="comentario" placeholder="¿Cómo fue la atención?" rows="4"></textarea>
      </div>
    `,
    width: '600px',
    customClass: {
      container: 'swal2-calificacion-modal',
      popup: 'swal2-calificacion-popup',
      htmlContainer: 'swal2-calificacion-html'
    },
    focusConfirm: false,
    preConfirm: () => {
      const puntaje = +(document.getElementById('puntaje') as HTMLInputElement).value;
      const comentario = (document.getElementById('comentario') as HTMLTextAreaElement).value.trim();

      if (!comentario) {
        Swal.showValidationMessage('El comentario es obligatorio');
        return;
      }

      return { puntaje, comentario };
    },
    didOpen: () => {
      const slider = document.getElementById('puntaje') as HTMLInputElement;
      const output = document.getElementById('sliderValue') as HTMLElement;
      
      slider.addEventListener('input', () => {
        output.textContent = slider.value;
      });
    }
  });


  if (!formValues) return;

  try {
    await this.turnosService.calificarAtencion(turno.id, formValues.puntaje, formValues.comentario);
    Swal.fire('¡Gracias!', 'Tu calificación fue enviada.', 'success');
    this.actualizarListado();
  } catch (error) {
    Swal.fire('Error', 'No se pudo guardar la calificación.', 'error');
  }
}



  actualizarListado() {
    this.cargando = true;
    this.turnosService
      .obtenerTurnosPorUsuario(this.usuario?.id!, 'pacienteId')
      .subscribe((respuesta) => {
        this.turnos = respuesta.sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
        this.actualizarFiltro(this.filtro);
        this.cargando = false;
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
