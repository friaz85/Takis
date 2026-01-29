import { Component, signal, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <a routerLink="/" class="back-btn">← Volver</a>

      <div class="glass-card">
        <div class="logo-container">
           <img src="assets/img/Banderin_01.png" alt="Takis" class="logo-img">
        </div>

        <h2 class="takis-title">REGISTRO <span class="highlight">TAKIS</span></h2>
        
        <form (submit)="onSubmit()">
          <div class="field">
            <label>NOMBRE COMPLETO</label>
            <input type="text" [(ngModel)]="form.name" name="name" required placeholder="Juan Perez">
          </div>
          <div class="field">
            <label>CORREO ELECTRONICO</label>
            <input type="email" [(ngModel)]="form.email" name="email" required placeholder="juan@email.com">
          </div>
          <div class="field">
            <label>TELEFONO</label>
            <input type="tel" [(ngModel)]="form.phone" name="phone" required placeholder="10 digitos">
          </div>
          
          <div class="terms">
            <input type="checkbox" [(ngModel)]="form.terms" name="terms" required id="tc">
            <label for="tc">Acepto los terminos y condiciones + aviso de privacidad</label>
          </div>

          <button type="submit" class="takis-btn" [disabled]="loading()">
            {{ loading() ? 'ENVIANDO CODIGO...' : 'CONTINUAR' }}
          </button>
          
          <div class="login-link">
             ¿Ya tienes cuenta? <a routerLink="/auth/login">Inicia Sesion</a>
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
      margin-top: 2rem;
    }
    .glass-card:hover, .glass-card:focus-within, .glass-card:active { 
      border-color: #F2E74B; 
      transform: translateY(-10px); 
      background: #57118cb5;
      backdrop-filter: blur(5px);
    }
    .logo-container { text-align: center; margin-bottom: 1.5rem; }
    .logo-img { width: 140px; filter: drop-shadow(0 0 10px rgba(108, 29, 218, 0.5)); }
    .highlight { color: #F2E74B; }
    .field { margin-bottom: 1.5rem; }
    .field label { display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 0.5rem; font-weight: bold; }
    .field input { width: 100%; padding: 1rem; border-radius: 0.5rem; background: rgba(0,0,0,0.2); border: 2px solid rgba(255,255,255,0.1); color: white; outline: none; transition: 0.3s; }
    .field input:focus { border-color: #6C1DDA; background: rgba(108, 29, 218, 0.05); box-shadow: 0 0 15px rgba(108, 29, 218, 0.3); }
    .terms { display: flex; align-items: flex-start; gap: 0.5rem; color: #ccc; font-size: 0.8rem; margin-bottom: 2rem; cursor: pointer; }
    .takis-btn { width: 100%; padding: 1.2rem; background: #F2E74B; color: #1A0B2E; border: none; border-radius: 1rem; font-weight: 900; cursor: pointer; transition: 0.2s; }
    .takis-btn:hover { transform: scale(1.02); box-shadow: 0 0 15px rgba(242, 231, 75, 0.4); }
    .login-link { text-align: center; margin-top: 1.5rem; color: #aaa; font-size: 0.9rem; }
    .login-link a { color: #F2E74B; text-decoration: none; font-weight: bold; }
    .login-link a:hover { text-decoration: underline; }
  `]
})
export class RegisterComponent implements OnInit {
  form = { name: '', email: '', phone: '', terms: false };
  loading = signal(false);

  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit() {
    if (!this.form.terms) {
      this.toast.show('Debes aceptar los terminos y condiciones.', 'info');
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(this.form.phone)) {
      this.toast.show('Por favor, ingresa un numero de telefono de 10 digitos.', 'error');
      return;
    }

    this.loading.set(true);
    this.http.post(`${environment.apiUrl}/auth/register`, this.form).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.toast.show(res.message || 'Codigo enviado.', 'success');
        this.router.navigate(['/auth/otp'], { queryParams: { email: this.form.email } });
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.messages?.error || err.error?.message || 'Error al registrar.';
        this.toast.show(msg, 'error');
      }
    });
  }
}
