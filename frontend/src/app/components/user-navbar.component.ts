import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-user-navbar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    template: `
    <nav class="user-nav">
       <div class="nav-content">
          <a routerLink="/portal" class="logo">
             <img src="assets/takis-logo.png" alt="Takis">
          </a>
          
          <div class="links">
             <a routerLink="/portal" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">MI PERFIL</a>
             <a routerLink="/portal/rewards" routerLinkActive="active">CANJEAR PREMIOS</a>
          </div>

          <button (click)="logout()" class="logout-btn">SALIR</button>
       </div>
    </nav>
  `,
    styles: [`
    .user-nav { 
      position: fixed; top: 0; left: 0; right: 0; 
      background: rgba(26, 11, 46, 0.95); backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255,255,255,0.1); z-index: 100;
    }
    .nav-content { 
      max-width: 1200px; margin: 0 auto; padding: 0 2rem; height: 70px; 
      display: flex; align-items: center; justify-content: space-between; 
    }
    .logo img { height: 40px; }
    
    .links { display: flex; gap: 2rem; }
    .links a { 
      color: #aaa; text-decoration: none; font-weight: bold; font-size: 0.9rem;
      padding: 0.5rem 0; border-bottom: 2px solid transparent; transition: 0.2s;
    }
    .links a:hover { color: white; }
    .links a.active { color: #F2E74B; border-color: #F2E74B; }
    
    .logout-btn { 
      background: transparent; border: 1px solid rgba(255,255,255,0.2); 
      color: white; padding: 0.5rem 1.2rem; border-radius: 2rem; 
      font-size: 0.8rem; cursor: pointer; transition: 0.3s;
    }
    .logout-btn:hover { background: #ff4444; border-color: #ff4444; }
  `]
})
export class UserNavbarComponent {
    private auth = inject(AuthService);
    private router = inject(Router);

    logout() {
        this.auth.logout();
        this.router.navigate(['/auth/login']);
    }
}
