import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NoVerificadoGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    try {
      const user = await this.authService.getCurrentUser();
      const perfil = await this.authService.getUserProfile();

      const emailConfirmado = user?.email_confirmed_at !== null;
      const rol = perfil?.rol;
      const verificado = perfil?.verificado;

      // Si el usuario ya está verificado, no puede acceder a esta ruta
      if (
        (rol === 'paciente' && emailConfirmado) ||
        (rol === 'especialista' && emailConfirmado && verificado) ||
        rol === 'admin'
      ) {
        this.router.navigate(['/home']);
        return false;
      }

      return true; // puede ver la página de esperando verificación
    } catch (error) {
      console.error('Error en NoVerificadoGuard:', error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}
