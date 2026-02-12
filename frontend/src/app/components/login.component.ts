import { Component, signal, inject, OnInit } from '@angular/core';
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
    <div class="landing">
      <a routerLink="/" class="back-link">← Volver</a>
      
      <div class="hero">
        <div class="hero-flex">
          <!-- Left Column: Banners -->
          <div class="hero-left">
            <div class="logo-wrapper">
              <img src="/assets/img/Banderin-completo.png" alt="Takis" class="takis-logo desktop-logo animate__animated animate__zoomIn">
              <img src="/assets/img/Banderin_01.png" alt="Takis" class="takis-logo mobile-logo animate__animated animate__zoomIn">
            </div>
          </div>

          <!-- Right Column: Login Form -->
          <div class="hero-right login-card">
            <h2 class="form-title">INICIAR SESION</h2>
            
            <form (submit)="onSubmit()" class="login-form">
              <div class="field">
                <label>CORREO ELECTRONICO</label>
                <input type="email" [(ngModel)]="email" name="email" required class="input-flat" placeholder="tu@correo.com">
              </div>

              <button type="submit" class="submit-btn" [disabled]="loading()">
                {{ loading() ? 'ENVIANDO...' : 'ENVIAR CODIGO DE ACCESO' }}
              </button>
              
              <div class="register-link">
                 No tienes cuenta? <a routerLink="/auth/register">Registrate aqui</a>
              </div>
            </form>
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

    .login-card {
      background: white;
      border-radius: 2rem;
      padding: 3rem 2rem;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      text-align: center;
    }

    .form-title {
        color: #560E8C;
        font-size: 2.5rem;
        font-weight: 900;
        margin: 0 0 2rem 0;
        text-transform: uppercase;
        letter-spacing: 1px;
        background: url('/assets/img/texture-purple.png'), #560E8C;
        background-size: cover;
        -webkit-background-clip: text;
        background-clip: text;
        color: #560E8C; 
    }

    .login-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .field { text-align: left; }
    
    .field label {
        display: block;
        color: #aaa;
        font-weight: 900;
        font-size: 1.3rem;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        text-align: center;
    }

    .input-flat {
        width: 100%;
        background: #F2F2F2;
        border: none;
        border-radius: 0.4rem;
        padding: 0.8rem 1rem;
        font-size: 1rem;
        color: #333;
        font-weight: bold;
        text-align: center;
        outline: none;
        transition: 0.2s;
    }
    
    .input-flat::placeholder {
        color: #b0b0b0;
        opacity: 1;
        font-weight: normal;
    }
    
    .input-flat:focus {
        background: #e0e0e0;
        box-shadow: 0 0 0 2px rgba(86, 14, 140, 0.2);
    }

    .submit-btn {
        background: #560E8C;
        color: white;
        border: none;
        padding: 1rem;
        border-radius: 0.5rem;
        font-size: 1.3rem;
        font-weight: 900;
        cursor: pointer;
        text-transform: uppercase;
        width: 100%;
        margin-top: 1rem;
        transition: 0.3s;
        font-family: 'TakisVeneer', 'Inter', sans-serif;
    }

    .submit-btn:hover:not(:disabled) {
        transform: translateY(-3px);
        background: #450b70;
        box-shadow: 0 5px 15px rgba(86, 14, 140, 0.4);
    }

    .submit-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
    
    .register-link {
        margin-top: 1rem;
        color: #888;
        font-size: 0.9rem;
    }
    
    .register-link a {
        color: #560E8C;
        text-decoration: none;
        font-weight: bold;
    }

    /* Responsive */
    .mobile-logo { display: none; }

    @media (max-width: 992px) {
        .hero-flex {
            flex-direction: column;
        }
        .hero-left {
            justify-content: center;
        }
        .desktop-logo { display: none; }
        .takis-logo { max-width: 280px; }
        .mobile-logo { display: block; width: 100%; height: auto; }
        .login-card {
            width: 100%;
            padding: 2rem 1.5rem;
        }
    }
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
      this.toast.show('El campo de correo es obligatorio.', 'info');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.email)) {
      this.toast.show('Por favor ingresa un correo electronico valido.', 'error');
      return;
    }

    this.loading.set(true);
    this.auth.requestLoginOtp(this.email).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.toast.show(res.message || 'Codigo enviado.', 'success');
        this.router.navigate(['/auth/otp'], { queryParams: { email: this.email } });
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.messages?.error || err.error?.message || 'Error. Verifica tu correo.';
        this.toast.show(msg, 'error');
      }
    });
  }
}
