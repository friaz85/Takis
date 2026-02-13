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

          <!-- Right Column: Register Form -->
          <div class="hero-right register-card">
            <h2 class="form-title">CREAR CUENTA</h2>
            
            <form (submit)="onSubmit()" class="register-form">
              <div class="field">
                <label>NOMBRE</label>
                <input type="text" [(ngModel)]="form.name" name="name" required class="input-flat" placeholder="Juan Perez">
              </div>

              <div class="field">
                <label>CORREO</label>
                <input type="email" [(ngModel)]="form.email" name="email" required class="input-flat" placeholder="ejemplo@correo.com">
              </div>

              <div class="field">
                <label>TELÉFONO</label>
                <input type="tel" [(ngModel)]="form.phone" name="phone" required class="input-flat" placeholder="10 dígitos">
              </div>

              <div class="check-group">
                <label class="checkbox-container">
                    HE LEÍDO Y ACEPTO <a href="https://takisaficionintensa.com.mx/tyc" target="_blank">TÉRMINOS Y CONDICIONES Y AVISO DE PRIVACIDAD</a>
                    <input type="checkbox" [(ngModel)]="form.acceptedLegal" name="acceptedLegal" required>
                    <span class="checkmark"></span>
                </label>
              </div>

              <button type="submit" class="submit-btn" [disabled]="loading()">
                {{ loading() ? 'ENVIANDO...' : 'REGISTRARME' }}
              </button>
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

    .register-card {
      background: white;
      border-radius: 2rem;
      padding: 3rem 2rem;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      text-align: center;
    }

    .form-title {
        color: #560E8C;
        font-size: clamp(1.8rem, 6vw, 2.5rem);
        font-weight: 900;
        margin: 0 0 2rem 0;
        text-transform: uppercase;
        letter-spacing: 1px;
        /* Add texture effect if possible, simplified for CSS */
        background: url('/assets/img/texture-purple.png'), #560E8C;
        background-size: cover;
        -webkit-background-clip: text;
        background-clip: text;
        /* Fallback color */
        color: #560E8C; 
    }

    .register-form {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
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
        color: #b0b0b0; /* Light grey placeholder */
        opacity: 1;
        font-weight: normal;
    }
    
    .input-flat:focus {
        background: #e0e0e0;
        box-shadow: 0 0 0 2px rgba(86, 14, 140, 0.2);
    }

    .check-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin: 1rem 0 2rem 0;
        align-items: center; /* Center checkboxes */
    }

    .checkbox-container {
        display: block;
        position: relative;
        padding-left: 30px;
        cursor: pointer;
        font-size: 1.1rem;
        font-weight: bold;
        color: #aaa;
        user-select: none;
        text-transform: uppercase;
        text-align: left;
    }

    .checkbox-container input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;
    }

    .checkbox-container a {
        color: #560E8C;
        text-decoration: underline;
    }

    .checkmark {
        position: absolute;
        top: 2px;
        left: 0;
        height: 18px;
        width: 18px;
        background-color: #fff;
        border: 2px solid #560E8C;
        border-radius: 4px;
    }

    .checkbox-container:hover input ~ .checkmark {
        background-color: #f0e6f5;
    }

    .checkbox-container input:checked ~ .checkmark {
        background-color: #560E8C;
        border-color: #560E8C;
    }

    .checkmark:after {
        content: "";
        position: absolute;
        display: none;
    }

    .checkbox-container input:checked ~ .checkmark:after {
        display: block;
    }

    .checkbox-container .checkmark:after {
        left: 5px;
        top: 2px;
        width: 4px;
        height: 8px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
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
        max-width: 250px;
        margin: 0 auto;
        transition: 0.3s;
        font-family: 'acumin-pro', 'Inter', sans-serif;
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
        .register-card {
            width: 100%;
            padding: 2.5rem 1rem;
            border-radius: 1.5rem;
        }
    }
  `]
})
export class RegisterComponent implements OnInit {
  form = { name: '', email: '', phone: '', acceptedLegal: false };
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
    if (!this.form.name || !this.form.email || !this.form.phone) {
      this.toast.show('Todos los campos son obligatorios.', 'info');
      return;
    }

    if (!this.form.acceptedLegal) {
      this.toast.show('Debes aceptar los terminos y el aviso de privacidad.', 'info');
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(this.form.phone)) {
      this.toast.show('Por favor, ingresa un numero de telefono de 10 digitos.', 'error');
      return;
    }

    this.loading.set(true);
    // Remove privacy from payload if API doesn't expect it, or keep if generic
    const payload = { ...this.form };

    this.http.post(`${environment.apiUrl}/auth/register`, payload).subscribe({
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
