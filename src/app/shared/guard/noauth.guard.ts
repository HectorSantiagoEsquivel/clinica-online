import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

export const noAuthGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = await authService.getCurrentUser();

  if (!user) 
  {
    return true;
  } 
  else 
  {
    router.navigate(['/home']); 
    return false;
  }
};
