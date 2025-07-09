export type Rol = 'paciente' | 'especialista' | 'admin' | null;
export type EstadoEspecialista = 'pendiente'|'aprobado'|'desabilitado';

export interface Usuario
{
    id:string;
    nombre:string;
    apellido:string;
    fecha_nacimiento?:Date;
    dni:string;
    email:string;
    rol: Rol;
    estado?:EstadoEspecialista;
    obra_social?:string | null;
    verificado:boolean;
    fecha_registro?: string;
    imagen_perfil?:string;
    imagen_extra?:string;
}