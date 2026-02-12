import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const role = auth.getRole();
    if (auth.isAuthenticated()) {
        if (role === 'admin' || role === 'system_admin') return true;

        if (role === 'takis') {
            const url = state.url.toLowerCase();
            const username = auth.user()?.username;

            // Basic takis role paths
            if (url.includes('/admin/dashboard') || url.includes('/admin/stats') || url === '/admin' || url === '/admin/') {
                return true;
            }

            // Special access for takis_admin
            if (username === 'takis_admin' && (url.includes('/admin/orders') || url.includes('/admin/support'))) {
                return true;
            }

            router.navigate(['/admin/dashboard']);
            return false;
        }
    }

    router.navigate(['/admin/login']);
    return false;
};
