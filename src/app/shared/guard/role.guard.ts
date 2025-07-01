import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    try {
      const perfil = await this.authService.getUserProfile(); // <- Esto es lo correcto
      const expectedRoles: string[] = route.data['roles'];

    console.log('=== DEBUG ROLEGUARD ===');
    console.log('Perfil completo:', perfil); // Verifica toda la estructura
    console.log('Rol del usuario:', perfil?.rol, '(Tipo:', typeof perfil?.rol, ')');
    console.log('Roles esperados:', expectedRoles, '(Tipo:', typeof expectedRoles[0], ')');
    console.log('Ruta intentada:', route.routeConfig?.path);

      if (perfil && expectedRoles.includes(perfil.rol)) {
        return true;
      }

      // Redirigir si no tiene el rol correcto
      this.router.navigate(['/home']);
      return false;

    } catch (error) {
      console.error('Error en RoleGuard:', error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}
