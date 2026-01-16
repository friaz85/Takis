import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-sidebar shadow-lg">
      <div class="logo-section">
        <h1 class="logo-text">TAKIS <span class="highlight">PROMO</span></h1>
        <small>Portal Administrativo</small>
      </div>
      
      <nav class="nav-links">
        <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-item">
          <span class="icon">📊</span> Dashboard
        </a>
        <a routerLink="/admin/orders" routerLinkActive="active" class="nav-item">
          <span class="icon">📦</span> Pedidos
        </a>
        <a routerLink="/admin/rewards" routerLinkActive="active" class="nav-item">
          <span class="icon">🎁</span> Recompensas
        </a>
        <a routerLink="/admin/support" routerLinkActive="active" class="nav-item">
          <span class="icon">💬</span> Soporte
        </a>
      </nav>

      <div class="user-footer">
        <button (click)="clearCache()" class="action-btn cache-btn" title="Recargar página y limpiar caché local">
          <span class="icon">⚡</span> Recargar
        </button>
        <button (click)="logout()" class="action-btn logout-btn">
          <span class="icon">🚪</span> Cerrar Sesión
        </button>
      </div>
    </div>
  `,
  styles: [`
    .admin-sidebar { 
      width: 260px; 
      height: 100vh; 
      background: linear-gradient(180deg, #2D1B4E 0%, #1A0B2E 100%); 
      border-right: 1px solid rgba(255,255,255,0.1); 
      display: flex; 
      flex-direction: column; 
      position: fixed; 
      left: 0; 
      top: 0; 
      box-shadow: 4px 0 20px rgba(0,0,0,0.3);
      z-index: 100;
    }
    .logo-section { padding: 2rem; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; }
    .logo-text { color: white; margin: 0; font-weight: 800; letter-spacing: -1px; font-size: 1.5rem; }
    .highlight { color: #F2E74B; }
    small { color: #888; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px; }
    
    .nav-links { flex: 1; padding: 2rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .nav-item { 
      display: flex; align-items: center; gap: 1rem; padding: 0.8rem 1.2rem; 
      color: #aaa; text-decoration: none; border-radius: 0.5rem; 
      font-weight: 500; transition: all 0.2s; 
    }
    .nav-item:hover { background: rgba(255,255,255,0.05); color: white; transform: translateX(5px); }
    .nav-item.active { background: #6C1DDA; color: white; box-shadow: 0 4px 15px rgba(108, 29, 218, 0.3); }
    .icon { font-size: 1.2rem; }

    .user-footer { padding: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 0.5rem; }
    .action-btn { 
      background: transparent; border: 1px solid rgba(255,255,255,0.1); 
      color: #888; padding: 0.6rem; border-radius: 0.4rem; cursor: pointer; 
      display: flex; align-items: center; justify-content: center; gap: 0.5rem; 
      font-size: 0.8rem; transition: all 0.2s;
    }
    .action-btn:hover { background: rgba(255,255,255,0.05); color: white; border-color: white; }
    .logout-btn:hover { background: rgba(255, 50, 50, 0.1); color: #ff5555; border-color: #ff5555; }
    .cache-btn:hover { background: rgba(242, 231, 75, 0.1); color: #F2E74B; border-color: #F2E74B; }
  `]
})
export class AdminNavbarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }

  clearCache() {
    window.location.reload();
  }
}
