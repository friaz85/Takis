import { Component, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-otp',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="auth-page">
      <div class="glass-card">
        <h2 class="title">VERIFICACIÓN <span class="highlight">OTP</span></h2>
        <p class="subtitle">Ingresa el código enviado a {{ email }}</p>
        
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
    .auth-page { min-height: 100vh; background: #1A0B2E; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .glass-card { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); padding: 3rem; border-radius: 2rem; width: 100%; max-width: 450px; border: 1px solid rgba(255,255,255,0.1); text-align: center; }
    .title { color: white; font-weight: 900; font-size: 2rem; margin-bottom: 0.5rem; }
    .subtitle { color: #aaa; margin-bottom: 2rem; font-size: 0.9rem; }
    .highlight { color: #F2E74B; }
    .otp-inputs input { width: 100%; padding: 1.5rem; font-size: 2rem; text-align: center; letter-spacing: 0.5rem; background: rgba(255,255,255,0.1); border: 2px solid #6C1DDA; border-radius: 1rem; color: white; outline: none; margin-bottom: 2rem; }
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

    constructor() {
        this.email = this.route.snapshot.queryParams['email'] || '';
    }

    verify() {
        this.loading.set(true);
        this.auth.verifyOtp(this.email, this.otp).subscribe({
            next: () => {
                this.loading.set(false);
                this.router.navigate(['/portal']);
            },
            error: (err) => {
                this.loading.set(false);
                alert('Error: ' + (err.error?.message || 'Código incorrecto.'));
            }
        });
    }
}
