import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class VerificadoGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    try {
      const user = await this.authService.getCurrentUser();
      const perfil = await this.authService.getUserProfile();

      const emailConfirmado = user?.email_confirmed_at !== null;
      const rol = perfil?.rol;
      const verificado = perfil?.verificado;


      if (rol === 'paciente') {
        if (emailConfirmado) return true;
        this.router.navigate(['/esperando-verificacion'], { queryParams: { rol } });
        return false;
      }


      if (rol === 'especialista') {
        if (emailConfirmado && verificado) return true;
        this.router.navigate(['/esperando-verificacion'], { queryParams: { rol } });
        return false;
      }


      if (rol === 'admin') return true;

      this.router.navigate(['/home']);
      return false;

    } catch (error) {
      console.error('Error en VerificadoGuard:', error);
      this.router.navigate(['/home']);
      return false;
    }
  }
}
