import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AdminLayoutService } from '../services/admin-layout.service';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <!-- Floating Open Button (visible when closed) -->
    <button *ngIf="!layoutService.isSidebarOpen()" class="sidebar-toggle floating" (click)="layoutService.openSidebar()">
      <span class="icon">☰</span>
    </button>

    <!-- Overlay for mobile when sidebar is open -->
    <div class="sidebar-overlay" *ngIf="layoutService.isSidebarOpen() && isMobile" (click)="layoutService.closeSidebar()"></div>

    <div class="admin-sidebar shadow-lg" [class.closed]="!layoutService.isSidebarOpen()">
      <div class="logo-section">
        <!-- Close Button inside sidebar -->
        <button class="sidebar-toggle internal" (click)="layoutService.closeSidebar()">
          <span class="icon">✕</span>
        </button>
        <h1 class="logo-text">TAKIS <span class="highlight">PROMO</span></h1>
        <small>Portal Administrativo</small>
      </div>
      
      <nav class="nav-links">
        <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-item" (click)="onNavItemClick()">
          <span class="icon">📊</span> Dashboard
        </a>
        <a routerLink="/admin/orders" routerLinkActive="active" class="nav-item" (click)="onNavItemClick()">
          <span class="icon">📦</span> Pedidos
        </a>
        <a routerLink="/admin/users" routerLinkActive="active" class="nav-item" (click)="onNavItemClick()">
          <span class="icon">👥</span> Usuarios
        </a>
        <a routerLink="/admin/rewards" routerLinkActive="active" class="nav-item" (click)="onNavItemClick()">
          <span class="icon">🎁</span> Recompensas
        </a>
        <a routerLink="/admin/support" routerLinkActive="active" class="nav-item" (click)="onNavItemClick()">
          <span class="icon">💬</span> Soporte
        </a>
        <a routerLink="/admin/promo-codes" routerLinkActive="active" class="nav-item" (click)="onNavItemClick()">
          <span class="icon">🎫</span> Códigos Promocionales
        </a>
        <a routerLink="/admin/entry-codes" routerLinkActive="active" class="nav-item" (click)="onNavItemClick()">
          <span class="icon">🎟️</span> Códigos Canjeados
        </a>
      </nav>

      <div class="user-footer">
        <button (click)="logout()" class="action-btn logout-btn">
          <span class="icon">🚪</span> Cerrar Sesión
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-toggle {
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      z-index: 101;
    }
    
    .sidebar-toggle.floating {
      position: fixed;
      left: 15px;
      top: 3px;
      background: #6C1DDA;
      box-shadow: 0 4px 10px rgba(108, 29, 218, 0.4);
    }
    .sidebar-toggle.floating:hover { transform: scale(1.1); background: #7b2ff7; }

    .sidebar-toggle.internal {
      position: absolute;
      right: 15px;
      top: 15px;
      background: rgba(255,255,255,0.1);
      font-size: 0.9rem;
    }
    .sidebar-toggle.internal:hover { background: rgba(255,255,255,0.2); }

    .sidebar-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      z-index: 99;
    }

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
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .admin-sidebar.closed { left: -260px; }

    .logo-section { padding: 2.5rem 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; position: relative; }
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

    @media (max-width: 1100px) {
      .sidebar-toggle.floating { top: 3px; left: 10px; }
    }
  `]
})
export class AdminNavbarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  public layoutService = inject(AdminLayoutService);

  isMobile = window.innerWidth <= 1100;

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isMobile = window.innerWidth <= 1100;
    if (this.isMobile && this.layoutService.isSidebarOpen()) {
      this.layoutService.closeSidebar();
    } else if (!this.isMobile && !this.layoutService.isSidebarOpen()) {
      this.layoutService.openSidebar();
    }
  }

  constructor() {
    // Initial check
    if (this.isMobile) {
      this.layoutService.closeSidebar();
    }
  }

  onNavItemClick() {
    if (this.isMobile) {
      this.layoutService.closeSidebar();
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }

  clearCache() {
    window.location.reload();
  }
}

