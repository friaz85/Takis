import { Component, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AnalyticsService } from '../services/analytics.service';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-page">
      <div class="glass-card">
        <div class="logo-container">
           <img src="assets/img/Banderin_01.png" alt="Takis" class="logo-img">
        </div>
        <h2 class="takis-title">VERIFICACION <span class="highlight">OTP</span></h2>
        <p class="subtitle">Ingresa el codigo enviado a {{ email }}</p>
        
        <div class="otp-inputs">
          <input type="text" [(ngModel)]="otp" maxlength="6" placeholder="000000">
        </div>

        <button (click)="verify()" class="takis-btn" [disabled]="loading()">
          {{ loading() ? 'VERIFICANDO...' : 'ENTRAR AL PORTAL' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; background: transparent; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .logo-container { text-align: center; margin-bottom: 1.5rem; }
    .logo-img { width: 140px; filter: drop-shadow(0 0 10px rgba(108, 29, 218, 0.5)); }
    .glass-card { 
      background: #1c03387d; 
      backdrop-filter: blur(5px); 
      padding: 3rem; 
      border-radius: 2rem; 
      width: 100%; 
      max-width: 450px; 
      border: 2px solid rgba(242, 231, 75, 0.2); 
      box-shadow: 0 40px 100px rgba(0,0,0,0.5);
      text-align: center;
      transition: 0.4s;
    }
    .glass-card:hover, .glass-card:focus-within, .glass-card:active { 
      border-color: #F2E74B; 
      transform: translateY(-10px); 
      background: #57118cb5;
      backdrop-filter: blur(5px);
    }
    .subtitle { color: #aaa; margin-bottom: 2rem; font-size: 0.9rem; }
    .highlight { color: #F2E74B; }
    .otp-inputs input { width: 100%; padding: 1.5rem; font-size: 2rem; text-align: center; letter-spacing: 0.5rem; background: rgba(255,255,255,0.1); border: 2px solid #6C1DDA; border-radius: 1rem; color: white; outline: none; margin-bottom: 2rem; transition: 0.3s; }
    .otp-inputs input:focus { box-shadow: 0 0 30px rgba(108, 29, 218, 0.4); background: rgba(108, 29, 218, 0.05); }
    .takis-btn { width: 100%; padding: 1.2rem; background: #F2E74B; color: #1A0B2E; border: none; border-radius: 1rem; font-weight: 900; cursor: pointer; }
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

  constructor() {
    this.email = this.route.snapshot.queryParams['email'] || '';
  }

  verify() {
    this.loading.set(true);
    this.auth.verifyOtp(this.email, this.otp).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        const user = res.user;

        // Track conversion for registration
        this.analytics.trackConversion('registration', user.id, { email: user.email });

        // If user has phone and address, go to rewards. Else, go to perfil.
        if (user.phone && user.address) {
          this.router.navigate(['/home']);
        } else {
          this.router.navigate(['/perfil']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        alert('Error: ' + (err.error?.message || 'Codigo incorrecto.'));
      }
    });
  }
}
