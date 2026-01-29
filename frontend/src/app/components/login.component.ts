import { Component, signal, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <a routerLink="/" class="back-btn">← Volver</a>

      <div class="glass-card">
        <div class="logo-container">
           <img src="assets/img/Banderin_01.png" alt="Takis" class="logo-img">
        </div>

        <h2 class="takis-title">INICIO <span class="highlight">SESION</span></h2>
        
        <form (submit)="onSubmit()">
          <div class="field">
            <label>CORREO ELECTRONICO</label>
            <input type="email" [(ngModel)]="email" name="email" required placeholder="tu@correo.com">
          </div>

          <!-- Password removed. OTP Login only -->

          <button type="submit" class="takis-btn" [disabled]="loading()">
            {{ loading() ? 'ENVIANDO...' : 'ENVIAR CODIGO DE ACCESO' }}
          </button>
          
          <div class="register-link">
             ¿No tienes cuenta? <a routerLink="/auth/register">Registrate aqui</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; background: transparent; display: flex; align-items: center; justify-content: center; padding: 1rem; position: relative; }
    .back-btn { 
      position: absolute; top: 2rem; left: 2rem; 
      color: rgba(255,255,255,0.7); text-decoration: none; 
      font-weight: bold; font-size: 0.9rem; transition: 0.2s;
      z-index: 10;
    }
    .back-btn:hover { color: #F2E74B; transform: translateX(-5px); }
    .glass-card { 
      background: #1c03387d; 
      backdrop-filter: blur(5px); 
      padding: 3rem; 
      border-radius: 2rem; 
      width: 100%; 
      max-width: 450px; 
      border: 2px solid rgba(242, 231, 75, 0.2); 
      box-shadow: 0 40px 100px rgba(0,0,0,0.5);
      transition: 0.4s;
    }
    .glass-card:hover, .glass-card:focus-within, .glass-card:active { 
      border-color: #F2E74B; 
      transform: translateY(-10px); 
      background: #57118cb5;
      backdrop-filter: blur(5px);
    }
    .logo-container { text-align: center; margin-bottom: 2rem; }
    .logo-img { width: 180px; filter: drop-shadow(0 0 10px rgba(108, 29, 218, 0.5)); }
    .highlight { color: #F2E74B; }
    .field { margin-bottom: 1.5rem; }
    .field label { display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 0.5rem; font-weight: bold; }
    .field input { width: 100%; padding: 1rem; border-radius: 0.5rem; background: rgba(0,0,0,0.2); border: 2px solid rgba(255,255,255,0.1); color: white; outline: none; transition: 0.3s; }
    .field input:focus { border-color: #6C1DDA; background: rgba(108, 29, 218, 0.05); box-shadow: 0 0 15px rgba(108, 29, 218, 0.3); }
    .takis-btn { width: 100%; padding: 1.2rem; background: #F2E74B; color: #1A0B2E; border: none; border-radius: 1rem; font-weight: 900; cursor: pointer; transition: 0.2s; }
    .takis-btn:hover { transform: scale(1.02); box-shadow: 0 0 15px rgba(242, 231, 75, 0.4); }
    .register-link { text-align: center; margin-top: 1.5rem; color: #aaa; font-size: 0.9rem; }
    .register-link a { color: #F2E74B; text-decoration: none; font-weight: bold; }
    .register-link a:hover { text-decoration: underline; }
  `]
})
export class LoginComponent implements OnInit {
  email = '';
  loading = signal(false);

  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit() {
    if (!this.email) {
      this.toast.show('Ingresa tu correo.', 'info');
      return;
    }

    this.loading.set(true);
    // Call new method requestLoginOtp
    this.auth.requestLoginOtp(this.email).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.toast.show(res.message || 'Codigo enviado.', 'success');
        this.router.navigate(['/auth/otp'], { queryParams: { email: this.email } });
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Error. Verifica tu correo.';
        this.toast.show(msg, 'error');
      }
    });
  }
}
