import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserNavbarComponent } from './user-navbar.component';
import { WhatsappBubbleComponent } from './whatsapp-bubble.component';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, UserNavbarComponent, WhatsappBubbleComponent],
  template: `
    <user-navbar></user-navbar>
    <app-whatsapp-bubble></app-whatsapp-bubble>
    
    <div class="landing">
      <div class="hero">
        <div class="hero-flex">
          <!-- Left Column: Banners -->
          <div class="hero-left">
            <div class="logo-wrapper">
              <img src="/assets/img/Banderin-completo.png" alt="Takis" class="takis-logo desktop-logo animate__animated animate__zoomIn">
              <img src="/assets/img/Banderin_01.png" alt="Takis" class="takis-logo mobile-logo animate__animated animate__zoomIn">
            </div>
          </div>

          <!-- Right Column: Profile Form -->
          <div class="hero-right profile-card">
            <h2 class="form-title">MI PERFIL</h2>
            
            <form (submit)="save()" class="profile-form">
              
              <div class="form-grid">
                   <div class="field full-width">
                    <label>NOMBRE COMPLETO</label>
                    <input type="text" [(ngModel)]="profile.full_name" name="full_name" required class="input-flat" placeholder="NOMBRE COMPLETO" [disabled]="addressLocked()">
                  </div>

                  <div class="field">
                    <label>CORREO</label>
                    <input type="email" [(ngModel)]="profile.email" name="email" readonly class="input-flat readonly" placeholder="CORREO">
                  </div>

                  <div class="field">
                    <label>TELEFONO</label>
                    <input type="tel" [(ngModel)]="profile.phone" name="phone" required maxlength="10" class="input-flat" placeholder="10 DIGITOS" [disabled]="addressLocked()">
                  </div>

                  <div class="field full-width section-header">
                    <h3 class="dir-envio-title">DIRECCION DE ENVIO</h3>
                  </div>

                  <div class="field full-width">
                    <label>NOMBRE DE QUIEN RECIBE</label>
                    <input type="text" [(ngModel)]="profile.recipient_name" name="recipient_name" class="input-flat" placeholder="NOMBRE COMPLETO" [disabled]="addressLocked()">
                  </div>

                  <div class="field full-width">
                    <label>CALLE Y NUMERO</label>
                    <input type="text" [(ngModel)]="profile.address" name="address" required class="input-flat" placeholder="CALLE Y NUMERO" [disabled]="addressLocked()">
                  </div>

                  <div class="field">
                    <label>COLONIA</label>
                    <input type="text" [(ngModel)]="profile.colonia" name="colonia" required class="input-flat" placeholder="COLONIA" [disabled]="addressLocked()">
                  </div>

                  <div class="field">
                    <label>ALCALDIA / MUNICIPIO</label>
                    <input type="text" [(ngModel)]="profile.municipio" name="municipio" required class="input-flat" placeholder="ALCALDIA" [disabled]="addressLocked()">
                  </div>

                  <div class="field">
                    <label>ESTADO</label>
                    <select [(ngModel)]="profile.state" name="state" required class="input-flat select-flat" [disabled]="addressLocked()">
                      <option value="" disabled selected>SELECCIONA UN ESTADO</option>
                      <option *ngFor="let state of mexicoStates" [value]="state">{{ state | uppercase }}</option>
                    </select>
                  </div>
                  
                  <div class="field">
                    <label>CODIGO POSTAL</label>
                    <input type="text" [(ngModel)]="profile.zip_code" name="zip_code" required maxlength="5" class="input-flat" placeholder="CP" [disabled]="addressLocked()">
                  </div>

                  <div class="field full-width">
                    <label>INSTRUCCIONES DE ENTREGA</label>
                    <textarea [(ngModel)]="profile.delivery_instructions" name="delivery_instructions" class="input-flat textarea-flat" placeholder="INSTRUCCIONES ADICIONALES PARA LA ENTREGA" [disabled]="addressLocked()"></textarea>
                  </div>
              </div>

              <button type="submit" class="submit-btn" [disabled]="loading()">
                {{ loading() ? 'GUARDANDO...' : 'ACTUALIZAR DATOS' }}
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
      align-items: center; /* Center alignment restored */
      justify-content: center; 
      overflow-x: hidden;
      overflow-y: auto;
      position: relative;
      padding-top: 80px; /* Space for navbar */
    }

    .hero { 
      padding: 1rem 2rem 4rem 2rem; 
      z-index: 10;
      position: relative;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
    }

    .hero-flex {
      display: flex;
      align-items: flex-start; /* Align top used to work better for long forms */
      justify-content: center;
      gap: 2rem;
    }

    .hero-left { flex: 1; display: flex; justify-content: center; position: sticky; top: 100px; }
    
    .takis-logo { 
      width: auto;
      height: auto;
      max-height: 85vh; /* Restored original height */
      max-width: 100%;
      object-fit: contain;
    }

    .hero-right {
      flex: 1.5;
      max-width: 700px;
    }

    .profile-card {
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
    }

    .profile-form {
        text-align: left;
    }

    .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .field {
        margin-bottom: 0.5rem;
    }
    
    .full-width {
        grid-column: span 2;
    }

    .field label {
        display: block;
        color: #560E8C;
        font-weight: 900;
        font-size: 1.3rem;
        margin-bottom: 0.5rem;
        padding-left: 0.5rem;
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
        outline: none;
        transition: 0.2s;
    }
    .input-flat:focus {
        background: #e6e6e6;
        box-shadow: 0 0 0 2px #560E8C;
    }
    
    .input-flat:disabled {
        background: #e0e0e0;
        cursor: not-allowed;
        opacity: 0.8;
        color: #666;
    }
    
    .readonly {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .input-flat::placeholder {
        color: rgba(0,0,0,0.3);
        font-weight: normal;
    }

    .select-flat {
        cursor: pointer;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23560E8C' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 1rem center;
        background-size: 1.2rem;
        padding-right: 3rem;
        font-family: inherit;
    }

    .textarea-flat {
        min-height: 100px;
        resize: vertical;
        font-family: inherit;
    }

    .dir-envio-title {
        color: #560E8C;
        font-size: 1.5rem;
        font-weight: 900;
        margin: 1.5rem 0 0.5rem 0;
        text-align: center;
        width: 100%;
        border-top: 1px solid rgba(86, 14, 140, 0.1);
        padding-top: 1.5rem;
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
        max-width: 300px;
        margin: 0 auto;
        display: block;
        transition: 0.3s;
        box-shadow: 0 10px 0 #3a095e, 0 20px 30px rgba(86, 14, 140, 0.4);
        font-family: 'TakisVeneer', 'Inter', sans-serif;
    }
    .submit-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 12px 0 #3a095e, 0 25px 40px rgba(86, 14, 140, 0.5);
    }
    .submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }


    /* Responsive */
    .mobile-logo { display: none; }

    @media (max-width: 992px) {
        .hero { padding: 1rem 0.5rem; }
        .hero-flex {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
        }
        .hero-left {
            position: relative;
            top: 0;
            margin-bottom: 2rem;
        }
        .desktop-logo { display: none; }
        .takis-logo { max-width: 250px; }
        .mobile-logo { display: block; width: 100%; height: auto; }
        
        .profile-card {
            width: 100%;
            padding: 2.5rem 0.8rem;
            border-radius: 1.5rem;
        }
        .form-grid {
            grid-template-columns: 1fr;
        }
        .full-width {
            grid-column: span 1;
        }
    }
  `]
})
export class UserProfileComponent implements OnInit {
  profile: any = {};
  loading = signal(false);
  addressLocked = signal(false);

  mexicoStates = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
    'Chihuahua', 'Ciudad de Mexico', 'Coahuila', 'Colima', 'Durango', 'Estado de Mexico',
    'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacan', 'Morelos', 'Nayarit',
    'Nuevo Leon', 'Oaxaca', 'Puebla', 'Queretaro', 'Quintana Roo', 'San Luis Potosi',
    'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatan', 'Zacatecas'
  ];

  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  ngOnInit() {
    this.auth.getProfile().subscribe({
      next: (res: any) => {
        this.profile = res.user || res;
        this.checkIfAddressLocked();
      },
      error: () => this.toast.show('Error al cargar perfil', 'error')
    });
  }

  save() {
    // Validations
    const requiredFields = ['full_name', 'phone', 'address', 'colonia', 'municipio', 'state', 'zip_code'];
    const missing = requiredFields.filter(field => !this.profile[field]);

    if (missing.length > 0) {
      this.toast.show('Por favor completa todos los campos requeridos.', 'info');
      return;
    }

    if (this.profile.phone.toString().length !== 10) {
      this.toast.show('El telefono debe tener 10 digitos.', 'info');
      return;
    }

    if (this.profile.zip_code.toString().length !== 5) {
      this.toast.show('El codigo postal debe tener 5 digitos.', 'info');
      return;
    }

    this.loading.set(true);
    // Add extra missing fields if backend requires them or clean object
    this.auth.updateProfile(this.profile).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.show('Datos actualizados correctamente!', 'success');
        this.checkIfAddressLocked();
        // Update session storage if needed logic is inside auth or just reload from there
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.show(err.error?.message || 'Error al actualizar perfil.', 'error');
      }
    });
  }

  checkIfAddressLocked() {
    const p = this.profile;
    const isComplete = !!(
      p.full_name?.toString().trim() &&
      p.phone?.toString().trim() &&
      p.recipient_name?.toString().trim() &&
      p.address?.toString().trim() &&
      p.colonia?.toString().trim() &&
      p.municipio?.toString().trim() &&
      p.state?.toString().trim() &&
      p.zip_code?.toString().trim()
    );
    this.addressLocked.set(isComplete);
    console.log('Profile complete check:', isComplete, p);
  }
}
