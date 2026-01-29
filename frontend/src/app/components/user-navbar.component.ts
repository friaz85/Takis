import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'user-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="user-nav">
       <div class="nav-content">
          <a routerLink="/home" class="logo">
             <img src="assets/img/Logo-Takis.png" alt="Takis">
          </a>
          
          <!-- Hamburger Button -->
          <button class="hamburger" (click)="toggleMenu()" [class.open]="isMenuOpen">
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div class="links" [class.open]="isMenuOpen">
             <a routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="isMenuOpen = false">🏠 INICIO</a>
             <a routerLink="/rewards" routerLinkActive="active" (click)="isMenuOpen = false">🎁 PREMIOS</a>
             <a routerLink="/como-funciona" routerLinkActive="active" (click)="isMenuOpen = false">❓ COMO FUNCIONA</a>
             <a routerLink="/perfil" routerLinkActive="active" (click)="isMenuOpen = false">👤 PERFIL</a>
             <a routerLink="/historial" routerLinkActive="active" (click)="isMenuOpen = false">📜 HISTORIAL</a>
             <button (click)="logout()" class="logout-btn mobile-only">SALIR</button>
          </div>

          <button (click)="logout()" class="logout-btn desktop-only">SALIR</button>
       </div>
    </nav>
  `,
  styles: [`
    .user-nav { 
      position: fixed; top: 0; left: 0; right: 0; 
      background: #f2e74b;
      border-bottom: 2px solid #5d1f87; 
      z-index: 1000;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    .nav-content { 
      max-width: 1400px; margin: 0 auto; padding: 0 2rem; height: 70px; 
      display: flex; align-items: center; justify-content: space-between; 
      position: relative;
    }
    .logo img { 
      height: 45px; 
      filter: drop-shadow(0 2px 5px rgba(93, 31, 135, 0.2));
      transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .logo:hover img { transform: scale(1.1) rotate(5deg); }
    
    .links { display: flex; gap: 2.5rem; align-items: center; }
    .links a { 
      color: #5d1f87; 
      text-decoration: none; 
      font-weight: 900; 
      font-size: 0.95rem;
      padding: 0.5rem 1rem; 
      border-radius: 0.5rem;
      transition: all 0.3s ease;
      letter-spacing: 0.5px;
      position: relative;
    }
    .links a:hover { 
      background: rgba(93, 31, 135, 0.1);
      transform: translateY(-2px);
    }
    .links a.active { 
      background: #5d1f87;
      color: #f2e74b;
      box-shadow: 0 4px 15px rgba(93, 31, 135, 0.3);
    }
    
    .logout-btn { 
      background: transparent; 
      border: 2px solid #5d1f87; 
      color: #5d1f87; 
      padding: 0.5rem 1.5rem; 
      border-radius: 2rem; 
      font-size: 0.85rem; 
      font-weight: 900;
      cursor: pointer; 
      transition: all 0.3s ease;
      letter-spacing: 1px;
    }
    .logout-btn:hover { 
      background: #5d1f87; 
      color: #f2e74b;
      transform: scale(1.05);
      box-shadow: 0 5px 15px rgba(93, 31, 135, 0.4);
    }

    .mobile-only { display: none; }
    .hamburger { display: none; }

    @media (max-width: 850px) {
      .desktop-only { display: none; }
      .mobile-only { display: block; margin-top: 1rem; }
      
      .hamburger { 
        display: flex; 
        flex-direction: column; 
        gap: 6px; 
        background: none; 
        border: none; 
        cursor: pointer;
        padding: 10px;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1100;
      }
      
      .hamburger span {
        display: block;
        width: 30px;
        height: 4px;
        background: #5d1f87;
        border-radius: 2px;
        transition: 0.3s;
      }

      .hamburger.open span:nth-child(1) { transform: translateY(10px) rotate(45deg); }
      .hamburger.open span:nth-child(2) { opacity: 0; }
      .hamburger.open span:nth-child(3) { transform: translateY(-10px) rotate(-45deg); }

      .links {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        background: #f2e74b;
        flex-direction: column;
        justify-content: center;
        gap: 2rem;
        transform: translateY(-100%);
        transition: 0.5s cubic-bezier(0.77, 0, 0.175, 1);
        z-index: 1050;
      }

      .links.open { transform: translateY(0); }
      .links a { font-size: 1.5rem; }
    }
  `]
})
export class UserNavbarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
