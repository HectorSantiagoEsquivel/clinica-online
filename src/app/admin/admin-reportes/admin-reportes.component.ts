import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { TurnosService } from '../../shared/services/turno.service';
import { AuthService } from '../../auth/auth.service';
import { BaseChartDirective } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpinnerDirective } from '../../shared/directives/spinner.directive';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-admin-reportes',
  templateUrl: './admin-reportes.component.html',
  styleUrls: ['./admin-reportes.component.scss'],
  imports: [BaseChartDirective, CommonModule, FormsModule, SpinnerDirective]
})
export class AdminReportesComponent implements OnInit {
  cargando = false;

  public ingresosData!: ChartData<'line'>;
  public ingresosOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: { legend: { display: false } }
  };

  public porEspecialidadData!: ChartData<'bar'>;
  public porEspecialidadOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    plugins: { legend: { display: false } }
  };

  public porDiaData!: ChartData<'bar'>;
  public porDiaOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { display: false } }
  };

  public solicitadosPorMedicoData!: ChartData<'bar'>;
  public finalizadosPorMedicoData!: ChartData<'bar'>;
  public medicoOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { display: false } }
  };

  public desde = '';
  public hasta = '';

  // ViewChild para capturar secciones DOM completas
  @ViewChild('graficoIngresos') graficoIngresos?: ElementRef;
  @ViewChild('graficoEspecialidad') graficoEspecialidad?: ElementRef;
  @ViewChild('graficoDia') graficoDia?: ElementRef;
  @ViewChild('graficoSolicitados') graficoSolicitados?: ElementRef;
  @ViewChild('graficoFinalizados') graficoFinalizados?: ElementRef;

  constructor(
    private turnosSvc: TurnosService,
    private authSvc: AuthService
  ) {}

  async ngOnInit() {
    this.cargando = true;
    await this.cargarIngresosPorDia();
    await this.cargarTurnosPorEspecialidad();
    await this.cargarTurnosPorDia();
    this.cargando = false;
  }

  private async cargarIngresosPorDia() {
    const datos = await this.authSvc.getLogsPorFecha();
    this.ingresosData = {
      labels: datos.map(d => d.fecha),
      datasets: [{
        data: datos.map(d => d.cantidad),
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
    this.porEspecialidadData = {
      labels: datos.map(d => d.especialidad),
      datasets: [{
        data: datos.map(d => d.cantidad),
        label: 'Turnos',
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    };
  }

  private async cargarTurnosPorDia() {
    const datos = await this.turnosSvc.getTurnosPorDia();
    this.porDiaData = {
      labels: datos.map(d => d.fecha),
      datasets: [{
        data: datos.map(d => d.cantidad),
        label: 'Turnos',
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
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

  public async descargarGraficosComoPDF() {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 60;

    const logoBase64 = await this.cargarLogoBase64();

    // Encabezado
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 50, 'F');
    doc.addImage(logoBase64, 'PNG', margin, 8, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('REPORTE DE GRÁFICOS', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, pageWidth / 2, 35, { align: 'center' });

    const charts = [
      { ref: this.graficoIngresos, titulo: 'Ingresos por Día' },
      { ref: this.graficoEspecialidad, titulo: 'Turnos por Especialidad' },
      { ref: this.graficoDia, titulo: 'Turnos por Día' },
      { ref: this.graficoSolicitados, titulo: 'Turnos Solicitados por Médico' },
      { ref: this.graficoFinalizados, titulo: 'Turnos Finalizados por Médico' }
    ];

    for (const { ref, titulo } of charts) {
      if (!ref?.nativeElement) continue;

      const canvas = await html2canvas(ref.nativeElement, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      const imgData = canvas.toDataURL('image/png');

      if (y > 230) {
        this.agregarPiePagina(doc, pageWidth);
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(13);
      doc.setTextColor(33, 37, 41);
      doc.setFont('helvetica', 'bold');
      doc.text(titulo, pageWidth / 2, y, { align: 'center' });
      y += 5;

      doc.addImage(imgData, 'PNG', margin, y, pageWidth - 2 * margin, 80);
      y += 90;
    }

    this.agregarPiePagina(doc, pageWidth);
    doc.save('reportes_clinica.pdf');
  }

  private agregarPiePagina(doc: jsPDF, pageWidth: number) {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text('Documento generado automáticamente - Clínica Online', pageWidth / 2, 285, { align: 'center' });
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 20, 285, { align: 'right' });
    }
  }

  private async cargarLogoBase64(): Promise<string> {
    const response = await fetch('assets/logoClinica.png');
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
