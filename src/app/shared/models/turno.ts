export type EstadoTurno = 
  | 'pendiente' 
  | 'aceptado' 
  | 'rechazado' 
  | 'cancelado' 
  | 'realizado';

export interface Turno {
  id: string;
  fecha: string;
  hora: string;
  estado: string;
  pacienteId: string;
  especialistaId: string;
  especialidadId: string;
  comentarioCancelacion?: string;
  comentarioCalificacion?: string;
  calificaAtencion:number;
  resena?: string;

  // Relaciones
  paciente?: {
    nombre: string;
    apellido: string;
  };

    especialista?: { 
        nombre: string;
        apellido: string;
    };

  especialidad?: {
    nombre: string;
  };
}
