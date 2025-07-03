import { Injectable } from '@angular/core';
import { SupabaseService } from '../shared/services/supabase.service';
import { Usuario } from '../shared/models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private supabase:SupabaseService) { }

  async registrarse(
    usuario: Usuario,
    password: string,
    imagenPerfil: File,
    imagenSecundaria?: File,
    especialidadesSeleccionadas: string[] = []
  ): Promise<any> {
    const { data, error } = await this.supabase.client.auth.signUp({
      email: usuario.email,
      password,
    });
    if (error) throw error;

    const userId = data.user?.id;
    if (!userId) throw new Error('No se pudo obtener el ID del usuario');

    const carpetaUsuario = `usuarios/${userId}-${usuario.nombre}`;



    // Preparar datos para insertar en la tabla usuarios
    const datosUsuario = {
      ...usuario,
      id: userId,
      obra_social: usuario.rol === 'paciente' ? usuario.obra_social || null : null
    };

    // Insertar usuario
    const { error: insertError } = await this.supabase.client
      .from('usuarios')
      .insert([datosUsuario]);
    if (insertError) throw insertError;

    // Subir imagen 1
    const { error: uploadError1 } = await this.supabase.client.storage
      .from('imagenes')
      .upload(`${carpetaUsuario}/imagen1.png`, imagenPerfil);
    if (uploadError1) throw uploadError1;


    // Subir imagen 2 si existe
    if (imagenSecundaria) {
      const { error: uploadError2 } = await this.supabase.client.storage
        .from('imagenes')
        .upload(`${carpetaUsuario}/imagen2.png`, imagenSecundaria);
      if (uploadError2) throw uploadError2;
    }

    if (usuario.rol === 'especialista' && especialidadesSeleccionadas.length > 0) {
      for (const nombre of especialidadesSeleccionadas) {
        // Buscar si ya existe
        const { data: existente, error: buscarError } = await this.supabase.client
          .from('especialidades')
          .select('*')
          .eq('nombre', nombre)
          .maybeSingle();

        if (buscarError) throw buscarError;

        let especialidadId = existente?.id;

        // Si no existe, la creo
        if (!especialidadId) {
          const { data: nuevaEspecialidad, error: crearError } = await this.supabase.client
            .from('especialidades')
            .insert([{ nombre, creada_por: userId }])
            .select()
            .single();
          if (crearError) throw crearError;
          especialidadId = nuevaEspecialidad.id;
        }

        // Insertar en tabla intermedia
        const { error: vincularError } = await this.supabase.client
          .from('especialista_especialidades')
          .insert([{ especialista_id: userId, especialidad_id: especialidadId }]);
        if (vincularError) throw vincularError;
      }
    }

    return data;
  }

  async cargarImagenesPerfil(usuario: Usuario): Promise<Usuario> {
    const carpetaUsuario = `usuarios/${usuario.id}-${usuario.nombre}`;

    const { data: urlPerfil } = this.supabase.client.storage
      .from('imagenes')
      .getPublicUrl(`${carpetaUsuario}/imagen1.png`);

    const { data: urlExtra } = this.supabase.client.storage
      .from('imagenes')
      .getPublicUrl(`${carpetaUsuario}/imagen2.png`);

    return {
      ...usuario,
      imagen_perfil: urlPerfil.publicUrl,
      imagen_extra: urlExtra.publicUrl
    };
  }




  async login(email:string,password:string)
  {
    const{data,error} =await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });
    if(error) throw error;
    return data;
  }

  async logout()
  {
    await this.supabase.client.auth.signOut();
  }

  async getCurrentUser()
  {
    const{data} = await this.supabase.client.auth.getUser();
    return data.user;
  }

  async getUserProfile(): Promise<Usuario> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase.client
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return this.cargarImagenesPerfil(data);
  }

  async traerUsuariosPorPerfil(rol: 'paciente' | 'especialista' | 'admin'): Promise<Usuario[]> {
  const { data, error } = await this.supabase.client
    .from('usuarios')
    .select('*')
    .eq('rol', rol);

  if (error) throw error;


  const usuariosConImagenes = await Promise.all(
    data.map(usuario => this.cargarImagenesPerfil(usuario))
  );

  return usuariosConImagenes;
}

  async traerEspecialistasPorEspecialidad(especialidadId: string): Promise<Usuario[]> {
    const { data, error } = await this.supabase.client
      .from('especialista_especialidades')
      .select('especialista:especialista_id (*)')
      .eq('especialidad_id', especialidadId);

    if (error) throw error;

    // Ajuste porque viene como array
    const filas = data as { especialista: Usuario[] }[];

    const especialistas = filas.map(f => f.especialista[0]);

    // Cargar imágenes
    const especialistasConImagenes = await Promise.all(
      especialistas.map(esp => this.cargarImagenesPerfil(esp))
    );

    return especialistasConImagenes;
  }





  async getSesion()
  {
    const { data } = await this.supabase.client.auth.getSession();
    return data.session;
  }
}

