import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { NAV_GROUPS } from '../config/nav-items';
import { AuthService } from '../services/auth.service';

/**
 * Route guard: `data: { permissions: ['bookings.view'] }` — passes when the user holds at least one
 * (admins always pass). Without `permissions` the route is open to any signed-in user.
 * Waits for the profile to be refreshed once per page load so a deep link never trusts stale,
 * cached permissions.
 */
export const permissionGuard: CanActivateFn = (route) => {
  const keys = route.data['permissions'] as string[] | undefined;
  if (!keys?.length) {
    return true;
  }
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureFresh().pipe(map(() => (auth.can(...keys) ? true : router.createUrlTree(['/forbidden']))));
};

/** Lands the user on the first screen they are allowed to see (dashboard for admins). */
export const homeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureFresh().pipe(
    map(() => {
      const user = auth.getUser();
      for (const group of NAV_GROUPS) {
        for (const item of group.items) {
          if (auth.canSeeNavItem(item, user)) {
            return router.createUrlTree([item.routerLink]);
          }
        }
      }
      return router.createUrlTree(['/forbidden']);
    }),
  );
};
