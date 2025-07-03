import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js';
import { TurnosService } from '../../shared/services/turno.service';
import { AuthService } from '../../auth/auth.service';
import { BaseChartDirective } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-reportes',
  templateUrl: './admin-reportes.component.html',
  styleUrls: ['./admin-reportes.component.scss'],
  imports:[BaseChartDirective,CommonModule,FormsModule]
})
export class AdminReportesComponent implements OnInit {
  // 1) Ingresos por día (line chart)
  public ingresosData!: ChartData<'line'>;
  public ingresosOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: { legend: { display: false } }
  };

  // 2) Turnos por especialidad (horizontal bar)
  public porEspecialidadData!: ChartData<'bar'>;
  public porEspecialidadOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    plugins: { legend: { display: false } }
  };

  // 3) Turnos por día (bar)
  public porDiaData!: ChartData<'bar'>;
  public porDiaOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { display: false } }
  };

  // 4+5) Turnos por médico
  public solicitadosPorMedicoData!: ChartData<'bar'>;
  public finalizadosPorMedicoData!: ChartData<'bar'>;
  public medicoOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { display: false } }
  };
  public desde = '';
  public hasta = '';

  constructor(
    private turnosSvc: TurnosService,
    private authSvc: AuthService
  ) {}

  async ngOnInit() {
    await this.cargarIngresosPorDia();
    await this.cargarTurnosPorEspecialidad();
    await this.cargarTurnosPorDia();
  }

  private async cargarIngresosPorDia() {
    const datos = await this.authSvc.getLogsPorFecha();
    const labels = datos.map(d => d.fecha);
    const values = datos.map(d => d.cantidad);
    this.ingresosData = {
      labels,
      datasets: [{
        data: values,
        label: 'Ingresos',
        fill: false,
        borderColor: 'rgba(54, 162, 235, 0.8)',
        backgroundColor: 'rgba(54, 162, 235, 0.3)',
        tension: 0.3
      }]
    };
  }

  private async cargarTurnosPorEspecialidad() {
    const datos = await this.turnosSvc.getTurnosPorEspecialidad();
    const labels = datos.map(d => d.especialidad);
    const values = datos.map(d => d.cantidad);
    this.porEspecialidadData = {
      labels,
      datasets: [{
        data: values,
        label: 'Turnos',
        backgroundColor: labels.map(() => 'rgba(75, 192, 192, 0.6)'),
        borderColor: labels.map(() => 'rgba(75, 192, 192, 1)'),
        borderWidth: 1
      }]
    };
  }

  private async cargarTurnosPorDia() {
    const datos = await this.turnosSvc.getTurnosPorDia();
    const labels = datos.map(d => d.fecha);
    const values = datos.map(d => d.cantidad);
    this.porDiaData = {
      labels,
      datasets: [{
        data: values,
        label: 'Turnos',
        backgroundColor: labels.map(() => 'rgba(255, 159, 64, 0.6)'),
        borderColor: labels.map(() => 'rgba(255, 159, 64, 1)'),
        borderWidth: 1
      }]
    };
  }

  public async filtrarPorMedico() {
    if (!this.desde || !this.hasta) return;
    const sol = await this.turnosSvc.getTurnosPorMedico(this.desde, this.hasta);
    const fin = await this.turnosSvc.getTurnosFinalizadosPorMedico(this.desde, this.hasta);

    const labels = sol.map(s => s.medico);
    this.solicitadosPorMedicoData = {
      labels,
      datasets: [{ data: sol.map(s => s.cantidad), label: 'Solicitados' }]
    };

    this.finalizadosPorMedicoData = {
      labels,
      datasets: [{ data: fin.map(f => f.cantidad), label: 'Finalizados' }]
    };
  }
}
