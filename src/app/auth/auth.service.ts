import { Injectable } from '@angular/core';
import { SupabaseService } from '../shared/services/supabase.service';
import { Usuario } from '../shared/models/usuario.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // -------------------------------------------------------------------
  // 1) Estado reactivo de la sesión
  // -------------------------------------------------------------------
  private _sessionSubject = new BehaviorSubject<Session | null>(null);
  public session$: Observable<Session | null> = this._sessionSubject.asObservable();

  constructor(private supabase: SupabaseService) {
    // Al iniciar, leo la sesión actual
    this.supabase.client.auth.getSession().then(({ data }) => {
      this._sessionSubject.next(data.session);
    });
    // Escucho cambios de auth (login/logout)
    this.supabase.client.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        this._sessionSubject.next(session);
      }
    );
  }

  // -------------------------------------------------------------------
  // 2) Registro de usuario
  // -------------------------------------------------------------------
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

    // Inserto perfil en tabla "usuarios"
    const datosUsuario = {
      ...usuario,
      id: userId,
      obra_social: usuario.rol === 'paciente' ? usuario.obra_social || null : null
    };
    const { error: insertError } = await this.supabase.client
      .from('usuarios')
      .insert([datosUsuario]);
    if (insertError) throw insertError;

    // Subo imágenes
    const { error: uploadError1 } = await this.supabase.client.storage
      .from('imagenes')
      .upload(`${carpetaUsuario}/imagen1.png`, imagenPerfil);
    if (uploadError1) throw uploadError1;

    if (imagenSecundaria) {
      const { error: uploadError2 } = await this.supabase.client.storage
        .from('imagenes')
        .upload(`${carpetaUsuario}/imagen2.png`, imagenSecundaria);
      if (uploadError2) throw uploadError2;
    }

    // Si es especialista, vinculo especialidades
    if (usuario.rol === 'especialista' && especialidadesSeleccionadas.length > 0) {
      for (const nombre of especialidadesSeleccionadas) {
        const { data: existente, error: buscarError } = await this.supabase.client
          .from('especialidades')
          .select('*')
          .eq('nombre', nombre)
          .maybeSingle();
        if (buscarError) throw buscarError;

        let especialidadId = existente?.id;
        if (!especialidadId) {
          const { data: nuevaEspecialidad, error: crearError } = await this.supabase.client
            .from('especialidades')
            .insert([{ nombre, creada_por: userId }])
            .select()
            .single();
          if (crearError) throw crearError;
          especialidadId = nuevaEspecialidad.id;
        }

        const { error: vincularError } = await this.supabase.client
          .from('especialista_especialidades')
          .insert([{ especialista_id: userId, especialidad_id: especialidadId }]);
        if (vincularError) throw vincularError;
      }
    }

    return data;
  }

  // -------------------------------------------------------------------
  // 3) Login / Logout
  // -------------------------------------------------------------------
  async login(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // Log de ingresos
    const userId = data.user?.id;
    if (userId) {
      await this.supabase.client.from('log_ingresos').insert([{ usuario_id: userId }]);
    }

    return data;
  }

  async logout() {
    await this.supabase.client.auth.signOut();
  }

  // -------------------------------------------------------------------
  // 4) Información del usuario actual
  // -------------------------------------------------------------------
  async getCurrentUser() {
    const { data } = await this.supabase.client.auth.getUser();
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

    // Cargo URLs de imágenes
    const carpetaUsuario = `usuarios/${data.id}-${data.nombre}`;
    const { data: urlPerfil } = this.supabase.client.storage
      .from('imagenes')
      .getPublicUrl(`${carpetaUsuario}/imagen1.png`);
    const { data: urlExtra } = this.supabase.client.storage
      .from('imagenes')
      .getPublicUrl(`${carpetaUsuario}/imagen2.png`);

    return {
      ...data,
      imagen_perfil: urlPerfil.publicUrl,
      imagen_extra: urlExtra.publicUrl
    };
  }

  // -------------------------------------------------------------------
  // 5) Funciones de reportes e informes (sin cambios)
  // -------------------------------------------------------------------
  async getLogsPorFecha(): Promise<{ fecha: string, cantidad: number }[]> {
    const { data, error } = await this.supabase.client
      .from('log_ingresos')
      .select('fecha');
    if (error) throw error;

    const conteo = new Map<string, number>();
    for (const row of data) {
      const dia = new Date(row.fecha).toISOString().split('T')[0];
      conteo.set(dia, (conteo.get(dia) || 0) + 1);
    }
    return Array.from(conteo.entries()).map(([fecha, cantidad]) => ({ fecha, cantidad }));
  }

  async traerUsuariosPorPerfil(rol: 'paciente' | 'especialista' | 'admin'): Promise<Usuario[]> {
    const { data, error } = await this.supabase.client
      .from('usuarios')
      .select('*')
      .eq('rol', rol);
    if (error) throw error;

    const usuariosConImagenes = await Promise.all(
      data.map(u => this.cargarImagenesPerfil(u))
    );
    return usuariosConImagenes;
  }

  async traerEspecialistasPorEspecialidad(especialidadId: string): Promise<Usuario[]> {
    const { data, error } = await this.supabase.client
      .from('especialista_especialidades')
      .select('especialista:especialista_id (*)')
      .eq('especialidad_id', especialidadId);
    if (error) throw error;

    const filas = data as { especialista: Usuario[] }[];
    const especialistas = filas.map(f => f.especialista[0]);
    return Promise.all(especialistas.map(esp => this.cargarImagenesPerfil(esp)));
  }

  async obtenerUsuarioPorId(id: string): Promise<Usuario> {
    const { data, error } = await this.supabase.client
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return this.cargarImagenesPerfil(data);
  }

  // -------------------------------------------------------------------
  // 6) Helper para subir imágenes de perfil
  // -------------------------------------------------------------------
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

  // -------------------------------------------------------------------
  // 7) Obtener sesión puntual (si la necesitas)
  // -------------------------------------------------------------------
  async getSesion() {
    const { data } = await this.supabase.client.auth.getSession();
    return data.session;
  }
}
