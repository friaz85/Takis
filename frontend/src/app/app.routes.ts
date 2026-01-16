import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing.component';
import { LoginComponent } from './components/login.component';
import { RegisterComponent } from './components/register.component';
import { OtpComponent } from './components/otp.component';
import { UserProfileComponent } from './components/user-profile.component';
import { PublicCatalogComponent } from './components/public-catalog.component';
import { RedeemRewardsComponent } from './components/redeem-rewards.component';
import { AdminDashboardComponent } from './components/admin-dashboard.component';
import { AdminRewardFormComponent } from './components/admin-reward-form.component';
import { AdminLoginComponent } from './components/admin-login.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
    { path: '', component: LandingComponent },

    // Public
    { path: 'catalog', component: PublicCatalogComponent },

    // Auth
    { path: 'auth', component: LoginComponent },
    { path: 'auth/login', component: LoginComponent },
    { path: 'auth/register', component: RegisterComponent },
    { path: 'auth/otp', component: OtpComponent },

    // User Portal (Protected)
    {
        path: 'portal',
        component: UserProfileComponent,
        canActivate: [authGuard]
    },
    {
        path: 'portal/rewards',
        component: RedeemRewardsComponent,
        canActivate: [authGuard]
    },

    // Admin Panel (Protected)
    { path: 'admin/login', component: AdminLoginComponent },
    {
        path: 'admin',
        redirectTo: 'admin/dashboard',
        pathMatch: 'full'
    },
    {
        path: 'admin/dashboard',
        component: AdminDashboardComponent,
        canActivate: [authGuard, adminGuard]
    },
    {
        path: 'admin/rewards',
        component: AdminRewardFormComponent,
        canActivate: [authGuard, adminGuard]
    },

    // Wildcard
    { path: '**', redirectTo: '' }
];
