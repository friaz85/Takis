import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const role = auth.getRole();
    if (auth.isAuthenticated() && (role === 'admin' || role === 'system_admin')) {
        return true;
    }

    router.navigate(['/admin/login']);
    return false;
};
