import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** UX-only guard. The backend must independently enforce admin permissions. */
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isAdmin()) return true;
  const router = inject(Router);
  return auth.isAuthenticated()
    ? router.createUrlTree(['/store'])
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
