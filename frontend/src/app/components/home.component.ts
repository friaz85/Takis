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
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, UserNavbarComponent, WhatsappBubbleComponent],
  template: `
    <user-navbar></user-navbar>
    <app-whatsapp-bubble></app-whatsapp-bubble>

    <!-- Splash Promo Modal -->
    <div *ngIf="showSplash()" class="landing-splash-overlay" (click)="closeSplash()">
      <div class="landing-splash-modal" (click)="$event.stopPropagation()">
        <button class="landing-splash-close" (click)="closeSplash()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="landing-splash-content">
          <img src="/assets/img/promo-puntos-dobles.png" alt="Promo Takis" class="promo-splash-img">
        </div>
      </div>
    </div>
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
                    <!-- Honeypot Field (Invisible) -->
                    <input type="text" name="website_check" [(ngModel)]="websiteCheck" style="display:none" tabindex="-1" autocomplete="off">
                    
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
            <div class="vigencia-text">
              Vigencia 16 de febrero al 30 de abril 2026<br>
              <a href="https://takisaficionintensa.com.mx/tyc" target="_blank" style="color: white; text-decoration: underline;">Consulta Términos y Condiciones</a>
            </div>
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
        font-size: clamp(1.8rem, 6vw, 3rem);
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
    .faqs-title {
        color: white;
        font-size: clamp(1.5rem, 5vw, 2.5rem);
        font-weight: 900;
        background: linear-gradient(to bottom, #fff 0%, #ccc 50%, #fff 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
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

    /* SweetAlert Button Custom Classes */
    ::ng-deep .takis-swal-confirm {
      background: #F2E74B !important;
      color: #5d1f87 !important;
      border-radius: 1.5rem !important;
      padding: 1rem 2.2rem !important;
      font-weight: 900 !important;
      font-size: 1.4rem !important;
      text-transform: uppercase !important;
      box-shadow: 0 8px 0 #b8af2e !important;
      font-family: 'acumin-pro', 'Inter', sans-serif !important;
      border: none !important;
      margin: 10px !important;
      cursor: pointer !important;
      transition: 0.1s;
    }
    ::ng-deep .takis-swal-confirm:hover { transform: translateY(-2px); box-shadow: 0 10px 0 #b8af2e !important; }
    ::ng-deep .takis-swal-confirm:active { transform: translateY(4px); box-shadow: 0 2px 0 #b8af2e !important; }

    /* Splash Modal Styles */
    .landing-splash-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(26, 11, 46, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.4s ease-out;
    }

    .landing-splash-modal {
      position: relative;
      max-width: 90vw;
      max-height: 85vh;
      background: #5d1f87;
      border-radius: 1.5rem;
      padding: 5px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.8), 0 0 30px rgba(242, 231, 75, 0.3);
      border: 2px solid #F2E74B;
      animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .landing-splash-content {
      overflow: hidden;
      border-radius: 1.2rem;
      display: flex;
    }

    .promo-splash-img {
      max-width: 100%;
      max-height: 80vh;
      object-fit: contain;
      display: block;
    }

    .landing-splash-close {
      position: absolute;
      top: -15px;
      right: -15px;
      width: 40px;
      height: 40px;
      background: #F2E74B;
      border: none;
      border-radius: 50%;
      color: #5d1f87;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 5px 15px rgba(0,0,0,0.4);
      z-index: 10001;
      transition: 0.2s;
    }

    .landing-splash-close:hover {
      transform: scale(1.1) rotate(90deg);
    }

    .landing-splash-close svg {
      width: 20px;
      height: 20px;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.8) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    @media (max-width: 768px) {
      .landing-splash-modal { max-width: 95vw; }
      .landing-splash-close { top: -10px; right: -10px; width: 35px; height: 35px; }
    }
  `]
})
export class HomeComponent implements OnInit {
  showSplash = signal(false);
  websiteCheck = ''; // Honeypot trap
  renderTs = 0;      // Time trap
  code = '';
  submitting = signal(false);
  userPoints = signal(0);
  userName = 'TAKIS FAN'; // Default

  private router = inject(Router);
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private auth = inject(AuthService);

  ngOnInit() {
    // START TIME TRAP
    this.renderTs = Math.floor(Date.now() / 1000);

    this.checkSplashVisibility();

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
      this.toastService.show('POR FAVOR INGRESA UN CÓDIGO', 'error');
      return;
    }

    this.submitting.set(true);
    if (typeof (window as any).fbq === 'function') {
      (window as any).fbq('trackCustom', 'IniciarPendiente');
    }
    const user = JSON.parse(localStorage.getItem('takis_session') || '{}')?.user;

    // Advanced Security Payload
    const payload = {
      code: this.code.toUpperCase(),
      user_id: user.id || 0,
      website_check: this.websiteCheck,
      render_ts: this.renderTs,
      device_fp: this.getDeviceFp()
    };

    this.http.post(`${environment.apiUrl}/codes/redeem`, payload).subscribe({
      next: (res: any) => {
        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).dataLayer.push({
          'event': 'canje_exitoso'
        });

        if (typeof (window as any).ttq !== 'undefined' && typeof (window as any).ttq.track === 'function') {
          (window as any).ttq.track('Canjear codigo', { 
            "contents": [ { "content_id": "code-redeem", "content_type": "product", "content_name": "Redeem Takis Code" } ], 
            "value": parseInt(res.points) || 0, 
            "currency": "USD" 
          });
        }

        this.toastService.show(`CÓDIGO ACEPTADO +${res.points} PUNTO(S)`, 'success', 5000);
        this.code = '';
        this.loadUserPoints();
        this.submitting.set(false);
      },
      error: (err: any) => {
        // Handle Blocked User (Auto Logout)
        if (err.status === 403) {
          Swal.fire({
            title: 'CUENTA BLOQUEADA',
            text: err.error?.message || 'Tu cuenta ha sido bloqueada. No puedes realizar esta acción.',
            icon: 'error',
            confirmButtonText: 'CERRAR',
            confirmButtonColor: '#F2E74B',
            background: '#1A0B2E',
            color: '#fff',
            allowOutsideClick: false,
            customClass: { confirmButton: 'takis-swal-confirm' },
            buttonsStyling: false
          }).then(() => {
            this.auth.logout();
            this.router.navigate(['/auth/login']);
          });
          this.submitting.set(false);
          return;
        }

        // Try to extract error message from different possible locations
        const errorMessage = err.error?.message ||
          err.error?.messages?.error ||
          err.message ||
          'ERROR AL CANJEAR EL CÓDIGO';
        this.toastService.show(errorMessage, 'error', 5000);
        this.submitting.set(false);
      }
    });
  }

  // Basic Fingerprint Generation
  private getDeviceFp(): string {
    try {
      // Combine user agent, screen res, language, timezone
      const raw = navigator.userAgent + screen.width + 'x' + screen.height + navigator.language + (new Date().getTimezoneOffset());
      // Simple hash-like string (Base64)
      return btoa(raw).slice(0, 32);
    } catch (e) {
      return 'unknown_fp';
    }
  }

  closeSplash() {
    this.showSplash.set(false);
  }

  private checkSplashVisibility() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth() is 0-indexed
    const day = now.getDate();

    // Show only on April 3 and 4, 2026 (CDMX local time)
    if (year === 2026 && month === 4 && (day === 3 || day === 4)) {
      this.showSplash.set(true);
    } else {
      this.showSplash.set(false);
    }
  }
}
