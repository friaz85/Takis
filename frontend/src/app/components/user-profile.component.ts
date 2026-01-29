import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserNavbarComponent } from './user-navbar.component';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, UserNavbarComponent],
  template: `
    <user-navbar></user-navbar>
    
    <div class="redeem-page">
      <div class="user-stats-bar">
         <div class="points-display">
            <div class="points-icon">⭐</div>
            <div class="points-info">
              <span class="points-label">Tus puntos</span>
              <span class="points-value">{{ profile.points || 0 | number }}</span>
            </div>
         </div>
      </div>

      <div class="content-wrapper">
        <div class="profile-card">
          <h2 class="takis-title">MIS <span class="highlight">DATOS</span></h2>
          
          <div class="form-grid">
            <div class="input-group full">
              <label>Nombre Completo</label>
              <input type="text" [(ngModel)]="profile.full_name" placeholder="Tu nombre intenso">
            </div>

            <div class="input-group">
              <label>WhatsApp / Celular (10 digitos)</label>
              <input type="text" [(ngModel)]="profile.phone" maxlength="10" placeholder="5551234567">
            </div>

            <div class="input-group">
              <label>Codigo Postal (5 digitos)</label>
              <input type="text" [(ngModel)]="profile.zip_code" maxlength="5" placeholder="01234">
            </div>

            <div class="input-group full">
              <label>Calle y Numero</label>
              <input type="text" [(ngModel)]="profile.address" placeholder="Av. Siempre Viva 123">
            </div>

            <div class="input-group">
              <label>Ciudad</label>
              <input type="text" [(ngModel)]="profile.city" placeholder="Puebla">
            </div>

            <div class="input-group">
              <label>Estado</label>
              <input type="text" [(ngModel)]="profile.state" placeholder="Estado">
            </div>
          </div>

          <button class="save-btn" (click)="save()" [disabled]="loading()">
            {{ loading() ? 'GUARDANDO...' : 'ACTUALIZAR DATOS' }}
          </button>

          @if (message()) {
            <div class="msg animate__animated animate__fadeInUp">{{ message() }}</div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .redeem-page { padding-top: 80px; background: transparent; min-height: 100vh; color: white; }
    
    .user-stats-bar { 
       background: transparent; 
       padding: 2rem; 
       text-align: center; 
       position: sticky; 
       top: 71px; 
       z-index: 90; 
       display: flex;
       justify-content: center;
    }
    .points-display { 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      gap: 1.5rem;
      background: #1c03387d;
      border: 2px solid rgba(242, 231, 75, 0.3);
      border-radius: 1.5rem;
      padding: 1.5rem 2.5rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: pointer;
    }
    .points-display:hover, .points-display:active { 
      border-color: #F2E74B; 
      transform: translateY(-10px); 
      background: #57118cb5;
      backdrop-filter: blur(5px);
    }
    .points-icon { 
      font-size: 3rem;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    .points-info { display: flex; flex-direction: column; text-align: center; }
    .points-label { 
      color: rgba(255, 255, 255, 0.7); 
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .points-value { 
      color: #F2E74B; 
      font-size: 2.5rem; 
      font-weight: 900;
      text-shadow: 0 2px 10px rgba(242, 231, 75, 0.5);
      line-height: 1;
    }

    .content-wrapper { padding: 3rem 2rem; max-width: 800px; margin: 0 auto; }
    
    .profile-card {
      background: #1c03387d; 
      backdrop-filter: blur(5px);
      border: 2px solid rgba(242, 231, 75, 0.2); 
      padding: 3rem; 
      border-radius: 2rem; 
      width: 100%;
      box-shadow: 0 40px 100px rgba(0,0,0,0.5);
      transition: 0.4s;
    }
    .profile-card:hover, .profile-card:focus-within, .profile-card:active { 
      border-color: #F2E74B; 
      transform: translateY(-10px); 
      background: #57118cb5;
      backdrop-filter: blur(5px);
    }


    .highlight { color: #F2E74B; }
    
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .full { grid-column: span 2; }
    
    .input-group label { display: block; color: #aaa; font-weight: bold; margin-bottom: 0.5rem; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
    .input-group input {
      width: 100%; padding: 1rem; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 1rem; color: #FFF; font-size: 1rem; outline: none; transition: 0.3s;
    }
    .input-group input:focus { 
      border-color: #6C1DDA; 
      background: rgba(108, 29, 218, 0.05); 
      box-shadow: 0 0 15px rgba(108, 29, 218, 0.3);
    }
    
    .save-btn {
      width: 100%; margin-top: 2.5rem; padding: 1.2rem; background: #F2E74B; color: #1A0B2E;
      border: none; border-radius: 1rem; font-size: 1.1rem; font-weight: 900; cursor: pointer;
      transition: 0.3s; text-transform: uppercase;
    }
    .save-btn:hover:not(:disabled) { background: white; transform: translateY(-2px); }
    .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .msg { margin-top: 1.5rem; text-align: center; color: #F2E74B; font-weight: bold; font-size: 1.1rem; }

    @media (max-width: 600px) {
      .form-grid { grid-template-columns: 1fr; }
      .full { grid-column: span 1; }
      .profile-card { padding: 1.5rem; }
      .takis-title { font-size: 2rem; }
    }
  `]
})
export class UserProfileComponent implements OnInit {
  profile: any = {};
  loading = signal(false);
  message = signal('');

  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.auth.getProfile().subscribe(res => {
      this.profile = res.user || res;
    });
  }

  save() {
    const phoneRegex = /^[0-9]{10}$/;
    const zipRegex = /^[0-9]{5}$/;

    if (!this.profile.full_name || this.profile.full_name.length < 3) {
      alert('Por favor ingresa un nombre valido.');
      return;
    }

    if (!this.profile.phone || !phoneRegex.test(this.profile.phone)) {
      alert('El telefono debe tener exactamente 10 digitos.');
      return;
    }

    if (!this.profile.zip_code || !zipRegex.test(this.profile.zip_code)) {
      alert('El codigo postal debe tener exactamente 5 digitos.');
      return;
    }

    this.loading.set(true);
    this.auth.updateProfile(this.profile).subscribe({
      next: () => {
        this.loading.set(false);
        this.message.set('¡Perfil actualizado con exito! 🌶️ Redirigiendo...');
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 2000);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Update Profile Error:', err);
        const errorMsg = err.error?.message || err.error?.error || 'Error desconocido';
        alert('No se pudo actualizar: ' + errorMsg);
      }
    });
  }
}
