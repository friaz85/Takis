import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserNavbarComponent } from './user-navbar.component';
import { WhatsappBubbleComponent } from './whatsapp-bubble.component';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, UserNavbarComponent, WhatsappBubbleComponent],
  template: `
    <user-navbar></user-navbar>
    <app-whatsapp-bubble></app-whatsapp-bubble>
    
    <div class="landing">
      <div class="hero">
        <div class="hero-flex">
          
          <!-- Left: Banderin (No Animation) -->
          <div class="hero-left">
            <div class="logo-wrapper">
              <img src="/assets/img/Banderin-completo.png" alt="Takis" class="takis-logo desktop-logo">
              <img src="/assets/img/Banderin_01.png" alt="Takis" class="takis-logo mobile-logo">
            </div>
          </div>
          
          <!-- Right: Home Card -->
          <div class="hero-right home-card" [style.backgroundImage]="'linear-gradient(rgba(86, 14, 140, 0.8), rgba(86, 14, 140, 0.6)), url(/assets/img/BG_soccer.jpg)'">
            
            <h1 class="welcome-title">¡HOLA {{ userName }}!</h1>
            
            <!-- Scoreboard Points Display -->
            <div class="scoreboard">
                <div class="score-end left-end"></div>
                <div class="score-bar">
                    <span class="score-label">TIENES</span>
                    
                    <div class="score-center-spacer"></div>

                    <span class="score-label">PUNTOS</span>
                    
                    <div class="score-center">
                        <span class="score-value">{{ userPoints() }}</span>
                    </div>
                </div>
                <div class="score-end right-end"></div>
            </div>

            <!-- Code Form -->
            <div class="code-section">
                <label class="code-label">REGISTRAR CÓDIGO</label>
                <div class="input-wrapper">
                    <input 
                      type="text" 
                      [(ngModel)]="code" 
                      placeholder="CÓDIGO"
                      (keyup.enter)="redeemCode()"
                      class="code-input"
                    >
                </div>

                <button (click)="redeemCode()" [disabled]="submitting()" class="redeem-btn">
                   {{ submitting() ? 'CANJEANDO...' : 'CANJEAR CÓDIGO' }}
                </button>

                <button (click)="goToRewards()" class="rewards-btn">
                   VER RECOMPENSAS
                </button>
            </div>

            <img src="/assets/img/Logo-Takis.png" class="corner-logo" alt="Takis Logo">
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
      overflow-y: auto;
      position: relative;
      padding-top: 60px; /* Space for navbar */
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

    .hero-left { flex: 1; display: flex; justify-content: center; }
    
    .takis-logo { 
      width: auto;
      height: auto;
      max-height: 85vh;
      max-width: 100%;
      object-fit: contain;
      /* No Animation */
    }

    .hero-right {
      flex: 1.2; 
      max-width: 600px;
    }

    .home-card {
      background-size: cover;
      background-position: center;
      border-radius: 2rem;
      padding: 2rem 2rem 8rem 2rem; /* Less top, More bottom */
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      text-align: center;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 500px;
      border: 1px solid rgba(242, 231, 75, 0.3);
    }

    .welcome-title {
        color: #f2e74b;
        font-size: 3rem;
        font-weight: 900;
        text-transform: uppercase;
        margin-bottom: 2rem;
        text-shadow: 0 4px 10px rgba(0, 0, 0, .5);
        letter-spacing: 2px;
        background: url(/assets/img/texture-gold.jpg);
        background-size: cover;
        -webkit-background-clip: text;
        margin-top: 0px;
    }

    /* Scoreboard Styles */
    .scoreboard {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin-bottom: 3rem;
        position: relative;
    }

    .score-bar {
        flex: 1;
        height: 60px;
        background: linear-gradient(to bottom, #f0f0f0 0%, #d9d9d9 50%, #bfbfbf 100%);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 2rem;
        border-top: 2px solid white;
        border-bottom: 2px solid #999;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        position: relative;
        z-index: 1;
    }

    .score-end {
        width: 50px;
        height: 60px;
        background: linear-gradient(180deg, #9b4db3 0%, #560E8C 100%);
        border: 2px solid #ccc;
        box-shadow: inset 0 0 10px rgba(0,0,0,0.3);
    }
    .left-end { border-radius: 10px 0 0 10px; border-right: none; }
    .right-end { border-radius: 0 10px 10px 0; border-left: none; }

    .score-label {
        color: #1A0B2E;
        font-weight: 900;
        font-size: 1.2rem;
        text-transform: uppercase;
        flex: 1;
        text-align: center;
    }
    
    .score-center-spacer { flex: 0 0 140px; } /* Space for the absolute center piece */

    .score-center {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 140px;
        height: 90px;
        background: radial-gradient(circle at center, #8e44ad 0%, #560E8C 100%);
        background-image: radial-gradient(#a569bd 1px, transparent 1px), radial-gradient(circle at center, #8e44ad 0%, #560E8C 100%);
        background-size: 4px 4px, 100% 100%;
        border: 2px solid #ccc;
        border-radius: 0 0 40px 40px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
        overflow: hidden;
    }
    
    /* Shine effect for score-center */
    .score-center::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 50%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
        animation: shine-center 5s infinite;
    }
    
    @keyframes shine-center {
        0% { left: -100%; }
        100% { left: 200%; }
    }

    .score-value {
        font-size: 2.5rem;
        font-weight: 900;
        background: linear-gradient(to bottom, #fff 0%, #ccc 50%, #fff 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        filter: drop-shadow(0 2px 0 rgba(0,0,0,0.5));
        white-space: nowrap;
    }

    /* Code Section */
    .code-section { width: 100%; max-width: 400px; }
    
    .code-label {
        display: block;
        color: white;
        font-weight: 900; /* Bolder */
        text-transform: uppercase;
        margin-bottom: 0.8rem;
        font-size: 1.5rem; /* Larger */
        text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        letter-spacing: 1px;
    }

    .input-wrapper {
        margin-bottom: 1.5rem;
    }

    .code-input {
        width: 100%;
        background: rgba(255,255,255,0.25); /* Lighter background */
        border: 2px solid rgba(255, 255, 255, 0.5); /* More visible border */
        padding: 1.2rem;
        border-radius: 0.8rem;
        color: white;
        font-size: 1.5rem; /* Larger text */
        text-align: center;
        text-transform: uppercase;
        font-weight: 900;
        outline: none;
        transition: 0.3s;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    .code-input:focus {
        background: rgba(255,255,255,0.35);
        border-color: #F2E74B;
        box-shadow: 0 0 20px rgba(242, 231, 75, 0.4);
    }
    .code-input::placeholder { 
        color: rgba(255,255,255,0.6); 
        font-weight: normal;
    }

    .redeem-btn {
        background: #F2E74B;
        color: #5d1f87;
        border: none;
        padding: 1rem 2rem;
        border-radius: 0.5rem;
        font-size: 1.2rem;
        font-weight: 900;
        cursor: pointer;
        text-transform: uppercase;
        width: 100%;
        transition: 0.2s;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        font-family: 'acumin-pro', 'Inter', sans-serif;
    }
    
    .redeem-btn:hover:not(:disabled) {
        transform: translateY(-2px);
    }

    .rewards-btn {
        background: transparent;
        color: #F2E74B;
        border: 2px solid #F2E74B;
        padding: 1rem 2rem;
        border-radius: 0.5rem;
        font-size: 1.2rem;
        font-weight: 900;
        cursor: pointer;
        text-transform: uppercase;
        width: 100%;
        transition: 0.2s;
        margin-top: 1rem;
        font-family: 'acumin-pro', 'Inter', sans-serif;
    }
    
    .rewards-btn:hover {
        background: rgba(242, 231, 75, 0.1);
        transform: translateY(-2px);
    }

    .corner-logo {
      position: absolute;
      bottom: 20px; /* Back inside */
      right: 20px;
      width: 90px;
      height: auto;
      filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3));
      z-index: 10;
    }


    /* Responsive */
    .mobile-logo { display: none; }

    @media (max-width: 992px) {
        .hero { padding: 1rem 0.5rem; }
        .corner-logo { display: none; } /* Hide on mobile */
        
        .hero-flex {
            flex-direction: column;
            gap: 1rem;
        }
        .hero-left {
            justify-content: center;
        }
        .desktop-logo { display: none; }
        .takis-logo { max-width: 250px; }
        .mobile-logo { display: block; width: 100%; height: auto; }
        .home-card {
            width: 100%;
            padding: 2rem 1rem 6rem 1rem;
            min-height: auto;
            border-radius: 1.5rem;
        }
        
        /* Scoreboard Responsive Fixes */
        .scoreboard { transform: scale(0.95); width: 100%; }
        .score-bar { padding: 0 0.5rem; }
        .score-label { font-size: 0.8rem; letter-spacing: 0; }
        .score-center-spacer { flex: 0 0 110px; }
        .score-center { width: 110px; }
        .score-value { font-size: 2rem; }
    }
  `]
})
export class HomeComponent implements OnInit {
  code = '';
  submitting = signal(false);
  userPoints = signal(0);
  userName = 'TAKIS FAN'; // Default

  private router = inject(Router);
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private auth = inject(AuthService);

  ngOnInit() {
    // Sync with auth user signal
    const user = this.auth.user();
    if (user) {
      this.setUserName(user);
    }

    // Effect-like behavior: update name if signal changes
    this.loadUserPoints();
  }

  private setUserName(user: any) {
    const rawName = user.full_name || user.name || 'TAKIS FAN';
    this.userName = rawName.split(' ')[0].toUpperCase();
  }

  loadUserPoints() {
    const user = JSON.parse(localStorage.getItem('takis_session') || '{}')?.user;
    if (user?.id) {
      this.http.get(`${environment.apiUrl}/user/points/${user.id}`).subscribe({
        next: (res: any) => {
          this.userPoints.set(res.points || 0);
        },
        error: () => {
          this.userPoints.set(0);
        }
      });
    }
  }

  goToRewards() {
    this.router.navigate(['/rewards']);
  }

  redeemCode() {
    if (!this.code.trim()) {
      this.toastService.show('Por favor ingresa un codigo', 'error');
      return;
    }

    this.submitting.set(true);
    const user = JSON.parse(localStorage.getItem('takis_session') || '{}')?.user;

    this.http.post(`${environment.apiUrl}/codes/redeem`, {
      code: this.code.toUpperCase(),
      user_id: user.id
    }).subscribe({
      next: (res: any) => {
        this.toastService.show(`Código aceptado +${res.points} punto`, 'success', 5000);
        this.code = '';
        this.loadUserPoints();
        this.submitting.set(false);
      },
      error: (err: any) => {
        // Try to extract error message from different possible locations
        const errorMessage = err.error?.message ||
          err.error?.messages?.error ||
          err.message ||
          'Error al canjear el codigo';
        this.toastService.show(errorMessage, 'error', 5000);
        this.submitting.set(false);
      }
    });
  }
}
