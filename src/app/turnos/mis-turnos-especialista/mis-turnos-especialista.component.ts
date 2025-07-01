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

@Component({
  selector: 'app-mis-turnos-especialista',
  standalone: true,
  imports: [FormsModule, SpinnerDirective, CommonModule],
  templateUrl: './mis-turnos-especialista.component.html',
  styleUrls: ['./mis-turnos-especialista.component.scss'],
})
export class MisTurnosEspecialistaComponent implements OnInit, OnDestroy {
  usuario?: Usuario;
  turnos: Turno[] = [];
  turnosFiltrados: Turno[] = [];
  filtro: string = '';
  cargando: boolean = false;
  sub?: Subscription;

  constructor(
    private authService: AuthService,
    private turnosService: TurnosService
  ) {}

  ngOnInit(): void {
    this.cargando = true;
    this.authService.getUserProfile().then((usuario) => {
      this.usuario = usuario;
      this.sub = this.turnosService
        .obtenerTurnos(usuario.id, 'especialista')
        .subscribe((turnos) => {
          console.log(usuario.id);
          this.turnos = turnos.sort((a, b) =>
            new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          );
          this.actualizarFiltro('');
          this.cargando = false;
        });
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

  async aceptarTurno(turnoId: string) {
    try {
      await this.turnosService.aceptarTurno(turnoId);
      Swal.fire({
        icon: 'success',
        title: 'Turno aceptado',
        text: 'El turno fue marcado como aceptado.',
      });
      this.actualizarListado();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo aceptar el turno.',
      });
    }
  }

  async rechazarTurno(turnoId: string) {
    const { value: comentario } = await Swal.fire({
      title: 'Motivo del rechazo',
      input: 'text',
      inputPlaceholder: 'Ingrese un comentario',
      showCancelButton: true,
    });

    if (!comentario) return;

    try {
      await this.turnosService.actualizarEstadoConComentario(turnoId, 'rechazado', comentario);
      Swal.fire({
        icon: 'success',
        title: 'Turno rechazado',
        text: 'El turno fue marcado como rechazado.',
      });
      this.actualizarListado();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo rechazar el turno.',
      });
    }
  }

async finalizarTurno(turnoId: string) {
  const { value: resena } = await Swal.fire({
    title: 'Finalizar Turno',
    input: 'textarea',
    inputLabel: 'Reseña / Diagnóstico',
    inputPlaceholder: 'Escribí un resumen de la consulta...',
    showCancelButton: true,
  });

  if (!resena) return;

  try {
    await this.turnosService.finalizarTurno(turnoId, resena);
    Swal.fire({
      icon: 'success',
      title: 'Turno finalizado',
      text: 'El turno fue marcado como realizado.',
    });
    this.actualizarListado();
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'No se pudo finalizar el turno.',
    });
  }
}


  actualizarListado() {
    this.cargando = true;
    this.turnosService
      .obtenerTurnosPorUsuario(this.usuario?.id!, 'especialistaId')
      .subscribe((respuesta) => {
        this.turnos = respuesta.sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
        this.actualizarFiltro(this.filtro);
        this.cargando = false;
      });
  }

  verResena(resena: string) {
  Swal.fire({
    title: 'Reseña del Turno',
    text: resena,
    icon: 'info',
    });
  }


  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
