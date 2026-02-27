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
      

      
      <div class="hero">
        <div class="hero-flex">
          <div class="hero-left">
            <div class="logo-wrapper">
              <img src="/assets/img/Banderin-completo.png" alt="Takis" class="takis-logo desktop-logo animate__animated animate__zoomIn">
              <img src="/assets/img/Banderin_01.png" alt="Takis" class="takis-logo mobile-logo animate__animated animate__zoomIn">
              <div class="logo-glow"></div>
            </div>
          </div>
          
          <div class="hero-right login-card" [style.backgroundImage]="'linear-gradient(rgba(86, 14, 140, 0.85), rgba(86, 14, 140, 0.85)), url(/assets/img/BG_landing.jpg)'">
            <h1 class="takis-title" style="color: #F2E74B">BIENVENIDO</h1>
            <p class="desc">Regístrate o inicia sesión</p>
            <div class="actions">
              <a routerLink="/auth/register" class="takis-btn primary">REGISTRARME</a>
              <a routerLink="/auth/login" class="takis-btn outline">INICIAR SESIÓN</a>
            </div>
            <img src="/assets/img/Logo-Takis.png" class="corner-logo" alt="Takis Logo">
            <div class="vigencia-text">Vigencia 16 de febrero al 30 de abril 2026</div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .landing { 
      min-height: 100vh; 
      width: 100vw;
      background: transparent; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      overflow-x: hidden;
      overflow-y: auto; /* Enable scroll if needed */
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
      padding: 1rem 2rem; 
      z-index: 10;
      position: relative;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
    }

    .hero-flex {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2rem;
    }

    .hero-left { flex: 1; display: flex; justify-content: flex-end; }
    .hero-right {
      flex: 1.2;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .login-card {
      background-size: cover;
      background-position: center;
      padding: 3rem;
      border-radius: 2rem;
      position: relative;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      border: 1px solid rgba(242, 231, 75, 0.3);
      min-height: 500px;
      justify-content: center;
    }

    .corner-logo {
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 80px;
      height: auto;
      filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3));
    }

    .vigencia-text {
      position: absolute;
      bottom: 25px;
      left: 0;
      width: 100%;
      text-align: center;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.85rem;
      font-weight: 500;
      z-index: 5;
    }

    .logo-wrapper {
      position: relative;
      display: inline-block;
    }

    .takis-logo { 
      width: auto;
      height: auto;
      max-height: 98vh;
      max-width: 100%;
      object-fit: contain;
      position: relative;
      z-index: 2;
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
    }

    @keyframes pulse {
      0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
      50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.8; }
    }



    .highlight { color: #F2E74B; }
    .desc { 
      color: #e0e0e0; 
      font-size: 1.1rem; 
      margin-bottom: 2rem; 
      font-weight: 500;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      text-align: center;
    }

    .actions { display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap; }

    .takis-btn { 
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem 2rem; 
      min-height: 50px;
      border-radius: 1rem; 
      font-weight: 900; 
      text-decoration: none; 
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
      font-size: 1.2rem; 
      text-align: center;
      font-family: 'acumin-pro', 'Inter', sans-serif;
    }

    .purple-btn {
      background: #560E8C;
      color: white;
      box-shadow: 0 10px 0 #3a095e, 0 20px 30px rgba(86, 14, 140, 0.4);
    }

    .purple-btn:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 0 #3a095e, 0 25px 40px rgba(86, 14, 140, 0.6);
      background: #6a1aa3;
    }

    .primary { 
      background: #F2E74B; 
      color: #5d1f87; 
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

    /* Desktop defaults */
    .mobile-logo { display: none; }

    @media (max-width: 992px) {
      .hero { padding: 1rem 0.5rem; }
      .hero-flex {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
      }
      .hero-left, .hero-right {
        justify-content: center;
        text-align: center;
        width: 100%;
      }
      .actions {
        justify-content: center;
        flex-direction: column;
      }
      .takis-logo { 
        max-width: 250px; 
        max-height: none; /* Let mobile version determine height */
      }
      .desktop-logo { display: none; }
      .mobile-logo { display: block; width: 100%; height: auto; }
      
      .login-card {
        padding: 3rem 1rem 5rem 1rem;
        width: 100%;
        border-radius: 1.5rem;
        min-height: auto;
      }
      
      .hero-flex {
        padding: 2rem 0; /* Add padding for scrollable content */
      }

      .takis-title {
        font-size: clamp(2.5rem, 10vw, 3.5rem) !important;
      }
      
      .corner-logo {
        width: 60px !important;
        bottom: 10px !important;
        right: 10px !important;
        opacity: 0.8;
      }
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
