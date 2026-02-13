import { Component, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AnalyticsService } from '../services/analytics.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="landing">
      <a routerLink="/auth/login" class="back-link">← Volver</a>
      
      <div class="hero">
        <div class="hero-flex">
          <!-- Left Column: Banners -->
          <div class="hero-left">
            <div class="logo-wrapper">
              <img src="/assets/img/Banderin-completo.png" alt="Takis" class="takis-logo desktop-logo animate__animated animate__zoomIn">
              <img src="/assets/img/Banderin_01.png" alt="Takis" class="takis-logo mobile-logo animate__animated animate__zoomIn">
            </div>
          </div>

          <!-- Right Column: OTP Card -->
          <div class="hero-right otp-card" [style.backgroundImage]="'linear-gradient(rgba(86, 14, 140, 0.9), rgba(86, 14, 140, 0.6)), url(/assets/img/BG_otp_new.jpg)'">
            <h2 class="form-title">VERIFICACIÓN <span style="color: #fff">OTP</span></h2>
            
            <p class="subtitle">
              Ingresa el código enviado a <span *ngIf="email">{{email}}</span>
            </p>

            <div class="otp-wrapper">
                <input type="text" [(ngModel)]="otp" maxlength="6" class="otp-input" placeholder="000000" (keyup.enter)="verify()">
            </div>
            
            <p class="spam-hint">Si no recibiste tu código, por favor revisa tu carpeta de SPAM o correo no deseado.</p>

            <div class="actions">
                <a (click)="resendCode()" class="resend-link">ENVIAR OTRO CÓDIGO.</a>
            </div>

            <button (click)="verify()" class="submit-btn" [disabled]="loading()">
              {{ loading() ? 'VERIFICANDO...' : 'CONTINUAR' }}
            </button>

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
    }

    .back-link {
        position: absolute;
        top: 2rem;
        left: 2rem;
        color: white;
        text-decoration: none;
        font-weight: bold;
        z-index: 100;
        cursor: pointer;
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
    
    .logo-wrapper { position: relative; display: inline-block; }
    
    .takis-logo { 
      width: auto;
      height: auto;
      max-height: 90vh;
      max-width: 100%;
      object-fit: contain;
      position: relative;
      z-index: 2;
    }

    .hero-right {
      flex: 1;
      max-width: 500px;
    }

    .otp-card {
      background-size: cover;
      background-position: center;
      border-radius: 2rem;
      padding: 3rem 2rem;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      text-align: center;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 500px;
    }

    .form-title {
        color: #F2E74B;
        font-size: clamp(2rem, 8vw, 3rem);
        font-weight: 900;
        margin: 0 0 1rem 0;
        text-transform: uppercase;
        letter-spacing: 2px;
        text-shadow: 0 4px 10px rgba(0,0,0,0.3);
    }

    .subtitle {
        color: white;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 2rem;
        line-height: 1.4;
        font-size: 1.3rem;
    }

    .otp-wrapper {
        margin-bottom: 2rem;
        width: 100%;
    }

    .otp-input {
        width: 100%;
        background: rgba(255,255,255,0.15);
        border: 2px solid rgba(242, 231, 75, 0.3);
        padding: 1.5rem;
        border-radius: 1rem;
        color: white;
        font-size: 2.3rem !important;
        text-align: center;
        text-transform: uppercase;
        font-weight: bold;
        outline: none;
        transition: 0.3s;
        letter-spacing: 0.5rem;
    }
    
    .otp-input::placeholder {
        color: rgba(255,255,255,0.3);
        letter-spacing: 0.1rem;
        font-size: 1.5rem;
    }

    .otp-input:focus {
        background: rgba(255,255,255,0.25);
        border-color: #F2E74B;
        box-shadow: 0 0 20px rgba(242, 231, 75, 0.2);
    }

    .spam-hint {
        color: rgba(255,255,255,0.8);
        font-size: 1rem;
        margin-top: -1rem;
        margin-bottom: 2rem;
        max-width: 80%;
    }

    .actions { margin-bottom: 2rem; }

    .resend-link {
        color: #F2E74B;
        font-weight: 900;
        font-style: italic;
        text-decoration: none;
        cursor: pointer;
        text-transform: uppercase;
        font-size: 1.1rem;
    }
    
    .resend-link:hover { text-decoration: underline; }

    .submit-btn {
        background: #F2E74B;
        color: #5d1f87;
        border: none;
        padding: 1rem 3rem;
        border-radius: 0.5rem;
        font-size: 1.3rem;
        font-weight: 900;
        cursor: pointer;
        text-transform: uppercase;
        transition: 0.3s;
        width: auto;
        min-width: 200px;
        font-family: 'acumin-pro', 'Inter', sans-serif;
    }

    .submit-btn:hover:not(:disabled) {
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.3);
    }
    
    .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

    .corner-logo {
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 80px;
      height: auto;
      filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3));
    }

    /* Responsive */
    .mobile-logo { display: none; }

    @media (max-width: 992px) {
        .hero { padding: 1rem 0.5rem; }
        .hero-flex {
            flex-direction: column;
            gap: 1rem;
        }
        .hero-left, .hero-right {
            justify-content: center;
            width: 100%;
            max-width: 100%;
        }
        .desktop-logo { display: none; }
        .takis-logo { max-width: 250px; }
        .mobile-logo { display: block; width: 100%; height: auto; }
        .otp-card {
            width: 100%;
            padding: 3rem 1rem;
            border-radius: 1.5rem;
            min-height: auto;
        }
    }
  `]
})
export class OtpComponent {
  otp = '';
  email = '';
  loading = signal(false);

  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private analytics = inject(AnalyticsService);
  private toast = inject(ToastService); // Reemplazando alert por ToastService

  constructor() {
    this.email = this.route.snapshot.queryParams['email'] || '';
  }

  verify() {
    if (!this.otp) {
      this.toast.show('Ingresa el codigo.', 'info');
      return;
    }

    if (this.otp.length !== 6) {
      this.toast.show('El codigo debe tener 6 digitos.', 'info');
      return;
    }

    this.loading.set(true);
    this.auth.verifyOtp(this.email, this.otp).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        const user = res.user;

        this.analytics.trackConversion('registration', user.id, { email: user.email });

        // Logic to redirect
        if (user.role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.messages?.error || err.error?.message || 'Codigo incorrecto.';
        this.toast.show(msg, 'error');
      }
    });
  }

  resendCode() {
    // Implement resend logic if backend supports it, for now just show a toast
    if (!this.email) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.loading.set(true);
    this.auth.requestLoginOtp(this.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.show('Codigo reenviado.', 'success');
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.messages?.error || err.error?.message || 'Error al reenviar codigo.';
        this.toast.show(msg, 'error');
      }
    });
  }
}
