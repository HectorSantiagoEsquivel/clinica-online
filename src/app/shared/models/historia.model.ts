export interface HistoriaClinica {
  id?: string;
  paciente_id: string;
  especialista_id?: string;
  turno_id?: string;
  altura: number;
  peso: number;
  temperatura: number;
  presion: string;
  datos_adicionales: { [clave: string]: any };
  fecha_creacion?: string;
}
