import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="profile-container">
      <div class="profile-card">
        <h2 class="takis-title">MI PERFIL TAKIS</h2>
        
        <div class="form-grid">
          <div class="input-group full">
            <label>Nombre Completo</label>
            <input type="text" [(ngModel)]="profile.full_name" placeholder="Tu nombre intenso">
          </div>

          <div class="input-group">
            <label>WhatsApp / Celular</label>
            <input type="text" [(ngModel)]="profile.phone" placeholder="10 dígitos">
          </div>

          <div class="input-group">
            <label>Código Postal</label>
            <input type="text" [(ngModel)]="profile.zip_code" placeholder="00000">
          </div>

          <div class="input-group full">
            <label>Calle y Número</label>
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
  `,
    styles: [`
    .profile-container { 
      min-height: 100vh; background: #1A0B2E; display: flex; align-items: center; justify-content: center; padding: 2rem;
    }
    .profile-card {
      background: rgba(108, 29, 218, 0.1); backdrop-filter: blur(15px);
      border: 3px solid #6C1DDA; padding: 3rem; border-radius: 2rem; width: 100%; max-width: 600px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .takis-title { color: #F2E74B; font-size: 2.5rem; font-weight: 900; text-align: center; margin-bottom: 2.5rem; text-shadow: 2px 2px 0 #6C1DDA; }
    
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .full { grid-column: span 2; }
    
    .input-group label { display: block; color: #FFF; font-weight: bold; margin-bottom: 0.5rem; font-size: 0.9rem; }
    .input-group input {
      width: 100%; padding: 1rem; background: rgba(255,255,255,0.05); border: 2px solid #6C1DDA;
      border-radius: 1rem; color: #FFF; font-size: 1rem; outline: none; transition: 0.3s;
    }
    .input-group input:focus { border-color: #F2E74B; background: rgba(242, 231, 75, 0.1); }
    
    .save-btn {
      width: 100%; margin-top: 2.5rem; padding: 1.2rem; background: #F2E74B; color: #1A0B2E;
      border: none; border-radius: 1rem; font-size: 1.2rem; font-weight: 900; cursor: pointer;
      transition: 0.3s; box-shadow: 0 10px 0 #b3ab37;
    }
    .save-btn:active { transform: translateY(5px); box-shadow: 0 5px 0 #b3ab37; }
    .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .msg { margin-top: 1.5rem; text-align: center; color: #F2E74B; font-weight: bold; }
  `]
})
export class UserProfileComponent implements OnInit {
    profile: any = {};
    loading = signal(false);
    message = signal('');

    private auth = inject(AuthService);

    ngOnInit() {
        this.auth.getProfile().subscribe(res => this.profile = res);
    }

    save() {
        const phoneRegex = /^[0-9]{10}$/;
        const zipRegex = /^[0-9]{5}$/;

        if (this.profile.phone && !phoneRegex.test(this.profile.phone)) {
            alert('El teléfono debe tener 10 dígitos.');
            return;
        }

        if (this.profile.zip_code && !zipRegex.test(this.profile.zip_code)) {
            alert('El código postal debe tener 5 dígitos.');
            return;
        }

        this.loading.set(true);
        this.auth.updateProfile(this.profile).subscribe({
            next: () => {
                this.loading.set(false);
                this.message.set('¡Datos actualizados con éxito!');
                setTimeout(() => this.message.set(''), 3000);
            },
            error: (err) => {
                this.loading.set(false);
                alert('Error al actualizar: ' + (err.error?.message || 'Error desconocido'));
            }
        });
    }
}
