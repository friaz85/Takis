import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing">
      <div class="dynamic-bg">
        <div class="blob one"></div>
        <div class="blob two"></div>
        <div class="blob three"></div>
      </div>
      
      <div class="hero">
        <div class="hero-flex">
          <div class="hero-left">
            <div class="logo-wrapper">
              <img src="assets/img/Banderin-completo.png" alt="Takis" class="takis-logo animate__animated animate__zoomIn">
              <div class="logo-glow"></div>
            </div>
          </div>
          
          <div class="hero-right">
            <h1 class="takis-title">¡SACA TU LADO <span class="highlight">INTENSO</span> Y GANA!</h1>
            <p class="desc">Registra tus codigos y canjea premios epicos.</p>
            <div class="actions">
              <a routerLink="/auth/register" class="takis-btn primary">REGISTRARME</a>
              <a routerLink="/auth/login" class="takis-btn outline">INICIAR SESION</a>
              <a routerLink="/catalog" class="takis-btn secondary">VER PREMIOS</a>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .landing { 
      min-height: 100vh; 
      background: transparent; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      overflow: hidden; 
      position: relative;
    }

    /* Dynamic Background */
    .dynamic-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      overflow: hidden;
    }

    .blob {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(108, 29, 218, 0.4) 0%, transparent 70%);
      border-radius: 50%;
      filter: blur(80px);
      animation: move 20s infinite alternate;
    }

    .one { top: -10%; left: -10%; background: radial-gradient(circle, rgba(108, 29, 218, 0.4) 0%, transparent 70%); }
    .two { bottom: -10%; right: -10%; background: radial-gradient(circle, rgba(242, 231, 75, 0.15) 0%, transparent 70%); animation-delay: -5s; }
    .three { top: 40%; left: 30%; background: radial-gradient(circle, rgba(255, 0, 0, 0.1) 0%, transparent 70%); animation-delay: -10s; }

    @keyframes move {
      from { transform: translate(0, 0) scale(1); }
      to { transform: translate(100px, 100px) scale(1.2); }
    }

    .hero { 
      padding: 4rem 2rem; 
      z-index: 10;
      position: relative;
      width: 100%;
      max-width: 1200px;
    }

    .hero-flex {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4rem;
    }

    .hero-left { flex: 1; display: flex; justify-content: flex-end; }
    .hero-right {
      flex: 1.2;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .logo-wrapper {
      position: relative;
      display: inline-block;
    }

    .takis-logo { 
      width: 100%;
      max-width: 450px; 
      position: relative;
      z-index: 2;
      filter: drop-shadow(0 0 30px rgba(0,0,0,0.5));
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }

    .logo-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(242, 231, 75, 0.2) 0%, transparent 70%);
      filter: blur(20px);
      z-index: 1;
      animation: pulse 3s infinite ease-in-out;
    }

    @keyframes pulse {
      0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
      50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.8; }
    }



    .highlight { color: #F2E74B; }
    .desc { 
      color: #e0e0e0; 
      font-size: 1.4rem; 
      margin-bottom: 3.5rem; 
      font-weight: 500;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      text-align: center;
    }

    .actions { display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap; }

    .takis-btn { 
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.4rem 3rem; 
      min-height: 60px;
      border-radius: 1.2rem; 
      font-weight: 900; 
      text-decoration: none; 
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
      font-size: 1.2rem; 
      text-align: center;
    }

    .primary { 
      background: #F2E74B; 
      color: #1A0B2E; 
      box-shadow: 0 10px 0 #b3ab37, 0 20px 30px rgba(242, 231, 75, 0.2); 
    }

    .primary:hover { 
      transform: translateY(-5px); 
      box-shadow: 0 15px 0 #b3ab37, 0 25px 40px rgba(242, 231, 75, 0.3); 
    }

    .secondary { 
      background: #6C1DDA; 
      color: white; 
      border: none;
      box-shadow: 0 10px 0 #4a148c, 0 20px 30px rgba(108, 29, 218, 0.4); 
    }

    .secondary:hover { 
      background: #7b2cff;
      transform: translateY(-5px);
      box-shadow: 0 15px 0 #4a148c, 0 25px 40px rgba(108, 29, 218, 0.6);
    }

    .outline {
      border: 3px solid #F2E74B;
      color: #F2E74B;
      background: rgba(242, 231, 75, 0.05);
    }

    .outline:hover {
      background: rgba(242, 231, 75, 0.1);
      transform: translateY(-5px);
      box-shadow: 0 15px 30px rgba(242, 231, 75, 0.2);
    }

    /* Decorative pieces */

    @media (max-width: 992px) {
      .hero-flex {
        flex-direction: column;
        text-align: center;
        gap: 0.1rem;
      }
      .hero-left, .hero-right {
        justify-content: center;
        text-align: center;
      }
      .actions {
        justify-content: center;
        flex-direction: column;
      }
      .headline { font-size: 2.5rem; }
      .takis-logo { max-width: 280px; }
    }
  `]
})
export class LandingComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/home']);
    }
  }
}
