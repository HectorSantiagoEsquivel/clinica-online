import { Component, OnInit, OnDestroy } from '@angular/core';
import { TurnosService } from '../../shared/services/turno.service';
import { Turno } from '../../shared/models/turno';
import { Subscription } from 'rxjs';
import { SpinnerDirective } from '../../shared/directives/spinner.directive';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-turnos-admin',
  standalone: true,
  imports: [FormsModule, SpinnerDirective, CommonModule],
  templateUrl: './turnos-admin.component.html',
  styleUrls: ['./turnos-admin.component.scss'],
})
export class TurnosAdminComponent implements OnInit, OnDestroy {
  turnos: Turno[] = [];
  turnosFiltrados: Turno[] = [];
  filtro: string = '';
  cargando: boolean = false;
  sub?: Subscription;

  constructor(private turnosService: TurnosService) {}

  ngOnInit(): void {
    this.cargando = true;
    this.sub = this.turnosService.obtenerTurnos(undefined, 'admin').subscribe((turnos) => {
      this.turnos = turnos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      this.actualizarFiltro('');
      this.cargando = false;
    });
  }

  actualizarFiltro(valor: string): void {
    this.filtro = valor.toLowerCase();
    if (this.filtro.length >= 3) {
      this.turnosFiltrados = this.turnos.filter(turno =>
        JSON.stringify(turno).toLowerCase().includes(this.filtro)
      );
    } else {
      this.turnosFiltrados = [...this.turnos];
    }
  }

  async cancelarTurno(turno: Turno) {
    const { value: comentario } = await Swal.fire({
      title: 'Cancelar Turno',
      input: 'textarea',
      inputLabel: 'Motivo de cancelación',
      inputPlaceholder: 'Ingrese el motivo...',
      showCancelButton: true,
    });

    if (!comentario) return;

    try {
      await this.turnosService.actualizarEstadoConComentario(turno.id, 'cancelado', comentario);
      Swal.fire('Cancelado', 'El turno fue cancelado exitosamente.', 'success');
      this.actualizarListado();
    } catch (error: any) {
      Swal.fire('Error', error.message || 'No se pudo cancelar el turno.', 'error');
    }
  }

  verResena(resena: string) {
    Swal.fire({
      title: 'Reseña del Turno',
      text: resena,
      icon: 'info',
    });
  }

  actualizarListado() {
    this.cargando = true;
    this.turnosService.obtenerTurnos(undefined, 'admin').subscribe((turnos) => {
      this.turnos = turnos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      this.actualizarFiltro(this.filtro);
      this.cargando = false;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
