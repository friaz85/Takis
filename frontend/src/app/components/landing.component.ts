import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing">
      <div class="hero">
        <img src="assets/takis-logo.png" alt="Takis" class="takis-logo animate__animated animate__bounceIn">
        
        <h1 class="headline">¡SACA TU LADO <span class="highlight">INTENSO</span> Y GANA!</h1>
        <p class="desc">Registra tus códigos y canjea premios épicos.</p>
        <div class="actions">
          <a routerLink="/auth/register" class="takis-btn primary">PARTICIPAR AHORA</a>
          <a routerLink="/catalog" class="takis-btn secondary">VER PREMIOS</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .landing { min-height: 100vh; background: #1A0B2E; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .hero { text-align: center; padding: 2rem; }
    .takis-logo { width: 300px; margin-bottom: 2rem; filter: drop-shadow(0 0 20px rgba(242, 231, 75, 0.3)); }
    .headline { font-size: 3.5rem; font-weight: 900; color: white; margin-bottom: 1rem; text-shadow: 4px 4px 0 #6C1DDA; }
    .highlight { color: #F2E74B; }
    .desc { color: #ccc; font-size: 1.2rem; margin-bottom: 3rem; }
    .actions { display: flex; gap: 1.5rem; justify-content: center; }
    .takis-btn { padding: 1.2rem 2.5rem; border-radius: 1rem; font-weight: 900; text-decoration: none; transition: 0.3s; font-size: 1.1rem; cursor: pointer; }
    .primary { background: #F2E74B; color: #1A0B2E; box-shadow: 0 10px 0 #b3ab37; }
    .primary:hover { transform: translateY(-3px); box-shadow: 0 13px 0 #b3ab37; }
    .secondary { border: 3px solid #6C1DDA; color: white; background: rgba(108, 29, 218, 0.2); }
    .secondary:hover { background: rgba(108, 29, 218, 0.4); }
  `]
})
export class LandingComponent { }
