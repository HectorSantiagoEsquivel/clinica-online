import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../auth/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = await authService.getCurrentUser();

  if (user) 
  {
    return true;
  } 
  else 
  {
    router.navigate(['/home'], { queryParams: { returnUrl: state.url } });
    return false;
  }
};
