import { Injectable } from '@angular/core';
import { SupabaseService } from '../shared/services/supabase.service';
import { Usuario } from '../shared/models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(private supabase:SupabaseService) { }

  async getUsuarios(): Promise <Usuario[]>
  {
    const {data,error} =await this.supabase.client.from('usuarios').select('*');
    if(error) throw error;
    return data;
  }

  async cambiarVerificacionEspecialista(id:string,estadoVerificacion:boolean):Promise<void>
  {
    const {error} = await this.supabase.client
      .from('usuarios')
      .update({verificado:estadoVerificacion})
      .eq('id', id);
    if (error) throw error;
  }

  async crearUsuarioDesdeAdmin(usuario: Usuario, password: string): Promise<void> {
  const { data, error } = await this.supabase.client.auth.admin.createUser({
    email: usuario.email,
    password,
    email_confirm: true, 
  });

  if (error) throw error;

  const userId = data.user?.id;
  if (!userId) throw new Error('No se pudo crear el usuario en auth');


  const { error: insertError } = await this.supabase.client
    .from('usuarios')
    .insert({
      ...usuario,
      id: userId,
    });

  if (insertError) throw insertError;
}


  

}
