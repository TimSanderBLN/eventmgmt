import { inject, Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;  // Benutzer ist eingeloggt, Zugriff erlaubt
  } else {
    router.navigate(['/login']);  // Umleiten zur Login-Seite
    return false;  // Zugriff verweigert
  }
};
