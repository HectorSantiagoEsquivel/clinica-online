import { Component, OnInit } from '@angular/core';
import { HistoriaClinicaService } from '../../services/historia.service';
import { AuthService } from '../../../auth/auth.service';
import { HistoriaClinica } from '../../models/historia.model';
import { Usuario } from '../../models/usuario.model';
import { TurnosService } from '../../services/turno.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EspecialidadService } from '../../../shared/services/especialidad.service';
import { ActivatedRoute } from '@angular/router';
import { Turno } from '../../models/turno';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-historia-clinica-paciente',
  templateUrl: './historia-clinica-paciente.component.html',
  styleUrls: ['./historia-clinica-paciente.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class HistoriaClinicaPacienteComponent implements OnInit {
  historias: {
    historia: HistoriaClinica;
    resena: string;
    fechaTurno: string;
    especialidad: string;
    especialistaNombre: string;
    pacienteNombre: string;
  }[] = [];

  usuarioActual?: Usuario;
  turnos: Turno[] = [];
  nombrePaciente: string = '';
  cargando: boolean = true;

  objectKeys = Object.keys;

  constructor(
    private historiaService: HistoriaClinicaService,
    private authService: AuthService,
    private turnosService: TurnosService,
    private especialidadService: EspecialidadService,
    private route: ActivatedRoute
  ) {}

async ngOnInit() {
  try {
    let paciente: Usuario | null = null;
    const pacienteId = this.route.snapshot.paramMap.get('pacienteId');

    if (pacienteId) {
      paciente = await this.authService.obtenerUsuarioPorId(pacienteId);
    } else {
      const user = await this.authService.getUserProfile();
      if (user && user.rol === 'paciente') {
        paciente = user;
      }
    }

    if (!paciente) return;

    this.usuarioActual = paciente;
    this.nombrePaciente = `${paciente.nombre} ${paciente.apellido}`;

    // Obtener historias y turnos del paciente
    const historias = await this.historiaService.obtenerHistoriaPorPaciente(paciente.id);
    const turnos = await this.turnosService.obtenerTurnosFiltrados({ pacienteId: paciente.id });

    const usuarios = new Map<string, Usuario>();
    const especialidades = new Map<string, string>();

    for (const turno of turnos) {
      // Mapear especialista
      if (!usuarios.has(turno.especialistaId)) {
        const especialista = await this.authService.obtenerUsuarioPorId(turno.especialistaId);
        usuarios.set(turno.especialistaId, especialista);
      }

      // Mapear especialidad
      if (!especialidades.has(turno.especialidadId)) {
        const especialidad = await this.especialidadService.obtenerEspecialidadPorId(turno.especialidadId);
        especialidades.set(turno.especialidadId, especialidad.nombre);
      }

      // Agregar nombre de especialista
      const especialista = usuarios.get(turno.especialistaId);
      turno.especialista = especialista ? { nombre: especialista.nombre, apellido: especialista.apellido } : undefined;

      // Agregar nombre de especialidad
      const nombreEspecialidad = especialidades.get(turno.especialidadId);
      turno.especialidad = nombreEspecialidad ? { nombre: nombreEspecialidad } : undefined;

      // Agregar paciente (solo nombre/apellido)
      turno.paciente = {
        nombre: paciente.nombre,
        apellido: paciente.apellido
      };

      // Asignar historia clínica si existe
      const historia = historias.find(h => h.turno_id === turno.id);
      if (historia) {
        turno.historiaClinica = {
          altura: historia.altura,
          peso: historia.peso,
          temperatura: historia.temperatura,
          presion: historia.presion,
          datos_adicionales: historia.datos_adicionales
        };
      }
    }

    this.turnos = turnos;
  } catch (error) {
    console.error('Error al cargar historias clínicas:', error);
  } finally {
    this.cargando = false;
  }
}

getClavesAdicionales(historia: any): string[] {
  return historia.datos_adicionales ? Object.keys(historia.datos_adicionales) : [];
}

async generarPdfDesdeTurnos() {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const logoBase64 = await this.cargarLogoBase64();
  
  // Encabezado con diseño moderno
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 60, 'F');
  doc.addImage(logoBase64, 'PNG', margin, 15, 40, 40);
  
  // Títulos con tipografía moderna
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('HISTORIA CLÍNICA', pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Paciente: ${this.nombrePaciente}`, pageWidth / 2, 40, { align: 'center' });
  
  // Información de fecha
  doc.setFontSize(11);
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, pageWidth / 2, 48, { align: 'center' });
  
  let y = 70;
  const turnosConHistoria = this.turnos.filter(t => t.historiaClinica);
  
  // Estilo para secciones
  const sectionStyle = {
    fillColor: [240, 245, 249],
    textColor: [41, 128, 185],
    fontStyle: 'bold'
  };
  
  for (let i = 0; i < turnosConHistoria.length; i++) {
    const turno = turnosConHistoria[i];
    const hc = turno.historiaClinica!;
    
    // Cabecera de sección con fondo moderno
    doc.setFillColor(52, 152, 219);
    doc.rect(margin, y, pageWidth - 2 * margin, 12, 'F');
    doc.setFontSize(12);
    doc.setTextColor('white');
    doc.setFont('helvetica', sectionStyle.fontStyle);
    doc.text(`CONSULTA: ${new Date(turno.fecha).toLocaleDateString()}`, margin + 5, y + 8);
    
    y += 15;
    
    // Datos en formato de tabla moderna
    const datos = [
      [`Especialidad:`, `${turno.especialidad?.nombre || '—'}`],
      [`Especialista:`, `${turno.especialista?.nombre} ${turno.especialista?.apellido}`],
      [`Altura:`, `${hc.altura} cm`],
      [`Peso:`, `${hc.peso} kg`],
      [`Temperatura:`, `${hc.temperatura} °C`],
      [`Presión:`, `${hc.presion || '—'}`]
    ];
    
    // Agregar campos dinámicos
    if (hc.datos_adicionales) {
      Object.entries(hc.datos_adicionales).forEach(([key, value]) => {
        datos.push([`${key}:`, `${value}`]);
      });
    }
    
    autoTable(doc, {
      startY: y,
      head: [['Campo', 'Valor']],
      body: datos,
      theme: 'grid',
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineColor: [200, 200, 200]
      },
      margin: { left: margin, right: margin }
    });
    
    y = (doc as any).lastAutoTable.finalY + 10;
    
    // Sección de reseña con diseño destacado
    doc.setDrawColor(52, 152, 219);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    
    y += 5;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('RESEÑA MÉDICA:', margin, y);
    
    y += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    const resena = turno.resena || 'No se registró reseña médica';
    const resenaLines = doc.splitTextToSize(resena, pageWidth - 2 * margin);
    resenaLines.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 6;
    });
    
    // Espaciado entre secciones
    y += 15;
    
    // Pie de página con número de página
    if (y > doc.internal.pageSize.getHeight() - 20) {
      this.agregarPiePagina(doc, pageWidth);
      doc.addPage();
      y = 20;
      this.agregarEncabezadoContinuacion(doc, pageWidth, this.nombrePaciente);
    }
  }
  
  // Pie de página final
  this.agregarPiePagina(doc, pageWidth);
  
  doc.save(`Historia_Clinica_${this.nombrePaciente.replace(/\s/g, '_')}.pdf`);
}

private agregarEncabezadoContinuacion(doc: jsPDF, pageWidth: number, nombrePaciente: string) {
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CONTINUACIÓN HISTORIA CLÍNICA', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Paciente: ${nombrePaciente}`, pageWidth / 2, 22, { align: 'center' });
}

private agregarPiePagina(doc: jsPDF, pageWidth: number) {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Línea decorativa
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(15, doc.internal.pageSize.getHeight() - 20, pageWidth - 15, doc.internal.pageSize.getHeight() - 20);
    
    // Texto del pie
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Documento generado automáticamente - Clínica Online', 
             pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
    
    // Número de página
    doc.text(`Página ${i} de ${pageCount}`, 
             pageWidth - 20, doc.internal.pageSize.getHeight() - 15, { align: 'right' });
  }
}

  private async cargarLogoBase64(): Promise<string> 
  {
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
