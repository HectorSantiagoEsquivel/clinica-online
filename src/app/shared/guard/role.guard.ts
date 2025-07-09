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
      const perfil = await this.authService.getUserProfile();
      const expectedRoles: string[] = route.data['roles'];

      // extrae el role y protégelo contra null
      const userRole = perfil?.rol ?? ''; // si es null, cae a string vacío

      console.log('Rol del usuario:', userRole, '(Tipo:', typeof userRole, ')');
      console.log('Roles esperados:', expectedRoles);

      if (expectedRoles.includes(userRole)) {
        return true;
      }

      this.router.navigate(['/home']);
      return false;

    } catch (error) {
      console.error('Error en RoleGuard:', error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}
