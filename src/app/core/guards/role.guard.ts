import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { UserRole } from '../models/roles.model';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const roles = route.data['roles'] as UserRole[] | undefined;
  if (!roles?.length) {
    return true;
  }
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasAnyRole(roles)) {
    return true;
  }
  void router.navigate(['/forbidden']);
  return false;
};
