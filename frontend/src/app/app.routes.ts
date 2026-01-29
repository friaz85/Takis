import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing.component';
import { LoginComponent } from './components/login.component';
import { RegisterComponent } from './components/register.component';
import { OtpComponent } from './components/otp.component';
import { HomeComponent } from './components/home.component';
import { UserProfileComponent } from './components/user-profile.component';
import { PublicCatalogComponent } from './components/public-catalog.component';
import { RedeemRewardsComponent } from './components/redeem-rewards.component';
import { HistoryComponent } from './components/history.component';
import { AdminDashboardComponent } from './components/admin-dashboard.component';
import { AdminRewardFormComponent } from './components/admin-reward-form.component';
import { AdminOrdersComponent } from './components/admin-orders.component';
import { AdminSupportComponent } from './components/admin-support.component';
import { AdminUsersComponent } from './components/admin-users.component';
import { AdminEntryCodesComponent } from './components/admin-entry-codes.component';
import { AdminPromoCodesComponent } from './components/admin-promo-codes.component';
import { AdminLoginComponent } from './components/admin-login.component';
import { HowItWorksComponent } from './components/how-it-works.component';
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
        path: 'home',
        component: HomeComponent,
        canActivate: [authGuard]
    },
    {
        path: 'perfil',
        component: UserProfileComponent,
        canActivate: [authGuard]
    },
    {
        path: 'rewards',
        component: RedeemRewardsComponent,
        canActivate: [authGuard]
    },
    {
        path: 'historial',
        component: HistoryComponent,
        canActivate: [authGuard]
    },
    {
        path: 'como-funciona',
        component: HowItWorksComponent,
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
    {
        path: 'admin/orders',
        component: AdminOrdersComponent,
        canActivate: [authGuard, adminGuard]
    },
    {
        path: 'admin/users',
        component: AdminUsersComponent,
        canActivate: [authGuard, adminGuard]
    },
    {
        path: 'admin/support',
        component: AdminSupportComponent,
        canActivate: [authGuard, adminGuard]
    },
    {
        path: 'admin/entry-codes',
        component: AdminEntryCodesComponent,
        canActivate: [authGuard, adminGuard]
    },
    {
        path: 'admin/promo-codes',
        component: AdminPromoCodesComponent,
        canActivate: [authGuard, adminGuard]
    },

    // Wildcard
    { path: '**', redirectTo: '' }
];
