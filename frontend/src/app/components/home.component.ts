import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserNavbarComponent } from './user-navbar.component';
import { ToastService } from '../services/toast.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, UserNavbarComponent],
  template: `
    <user-navbar></user-navbar>
    
    <div class="home-container">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-flex-layout">
          <div class="hero-left">
            <img src="assets/img/Banderin-completo.png" alt="Takis" class="hero-logo desktop-logo">
            <img src="assets/img/Banderin_01.png" alt="Takis" class="hero-logo mobile-logo">
          </div>
          
          <div class="hero-right">
            <h1 class="takis-title">¡GANA INCREIBLES <span class="highlight">PREMIOS</span>!</h1>
            <p class="hero-subtitle">¡Ingresa tus codigos y acumula puntos para premios epicos!</p>
            
            <!-- Code Input Card -->
            <div class="code-card">
              <h2>Ingresa tu codigo</h2>
              <div class="code-input-group">
                <input 
                  type="text" 
                  [(ngModel)]="code" 
                  placeholder="TAKIS-XXXX-XXXX"
                  (keyup.enter)="redeemCode()"
                  class="code-input"
                >
                <button (click)="redeemCode()" [disabled]="submitting()" class="redeem-btn">
                  {{ submitting() ? '⏳' : '🎁' }} {{ submitting() ? 'Canjeando...' : 'Canjear' }}
                </button>
              </div>
            </div>

            <!-- Points Display -->
            <div class="points-display">
              <div class="points-icon">⭐</div>
              <div class="points-info">
                <span class="points-label">Tus puntos</span>
                <span class="points-value">{{ userPoints() }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>


    </div>
  `,
  styles: [`
    .home-container { min-height: 100vh; background: transparent; }

    /* Hero Section */
    .hero-section { 
      position: relative; 
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      padding: 6rem 2rem 2rem 2rem;
    }

    .hero-flex-layout {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5rem;
      max-width: 1200px;
      width: 100%;
      z-index: 1;
    }

    .hero-left {
      flex: 1;
      display: flex;
      justify-content: flex-end;
    }

    .hero-right {
      flex: 1.2;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .hero-logo { 
      width: 100%;
      max-width: 450px; 
      height: auto; 
      filter: drop-shadow(0 10px 30px rgba(242, 231, 75, 0.5));
      animation: float 3s ease-in-out infinite;
    }
    .mobile-logo { display: none; }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }

    .hero-title { display: none; }

    .highlight { color: #F2E74B; }


    .hero-subtitle { 
      font-size: 1.5rem; 
      color: white; 
      margin: 0 0 2.5rem 0;
      opacity: 0.9;
      font-weight: 500;
      text-align: center;
    }

    /* Code Card */
    .code-card { 
      background: #1c03387d; 
      backdrop-filter: blur(5px);
      border: 2px solid rgba(242, 231, 75, 0.3);
      border-radius: 2rem; 
      padding: 2.5rem; 
      margin-bottom: 2rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .code-card:hover, .code-card:focus-within, .code-card:active { 
      border-color: #F2E74B; 
      transform: translateY(-10px); 
      background: #57118cb5;
      backdrop-filter: blur(5px);
    }

    .code-card h2 { 
      color: #F2E74B; 
      margin: 0 0 1.5rem 0; 
      font-size: 1.5rem;
      font-weight: 800;
    }
    .code-input-group { 
      display: flex; 
      gap: 1rem; 
      flex-wrap: wrap;
    }
    .code-input { 
      flex: 1; 
      min-width: 200px;
      background: rgba(0, 0, 0, 0.3); 
      border: 2px solid rgba(242, 231, 75, 0.5);
      color: white; 
      padding: 1.2rem 1.5rem; 
      border-radius: 1rem; 
      font-size: 1.1rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      outline: none;
      transition: 0.3s;
    }
    .code-input:focus { 
      border-color: #6C1DDA; 
      box-shadow: 0 0 20px rgba(108, 29, 218, 0.4);
    }
    .code-input::placeholder { color: rgba(255, 255, 255, 0.5); }
    .redeem-btn { 
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #F2E74B, #FFD700);
      border: none; 
      color: #1A0B2E; 
      padding: 1.2rem 2.5rem; 
      border-radius: 1rem;
      font-size: 1.1rem; 
      font-weight: 900; 
      cursor: pointer; 
      transition: 0.3s;
      box-shadow: 0 10px 30px rgba(242, 231, 75, 0.4);
      text-transform: uppercase;
      letter-spacing: 1px;
      text-align: center;
    }
    .redeem-btn:hover:not(:disabled) { 
      transform: translateY(-3px); 
      box-shadow: 0 15px 40px rgba(242, 231, 75, 0.6);
    }
    .redeem-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Points Display */
    .points-display { 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      gap: 1.5rem;
      background: #1c03387d;
      backdrop-filter: blur(5px);
      border: 2px solid rgba(242, 231, 75, 0.4);
      border-radius: 1.5rem;
      padding: 1.5rem 2rem;
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
    .points-info { display: flex; flex-direction: column; }
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
    }



    /* How It Works */
    .how-it-works { 
      padding: 4rem 2rem; 
      background: rgba(108, 29, 218, 0.1);
      text-align: center;
    }
    .how-it-works h2 { 
      color: #F2E74B; 
      font-size: 2.5rem; 
      margin: 0 0 3rem 0;
      font-weight: 900;
    }
    .steps { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 3rem; 
      max-width: 1200px;
      margin: 0 auto;
    }
    .step { 
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(242, 231, 75, 0.2);
      border-radius: 1.5rem;
      padding: 2rem;
      transition: 0.3s;
    }
    .step:hover { 
      border-color: #F2E74B;
      transform: translateY(-5px);
    }
    .step-number { 
      width: 60px; 
      height: 60px; 
      background: linear-gradient(135deg, #F2E74B, #FFD700);
      color: #1A0B2E; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      font-size: 2rem; 
      font-weight: 900; 
      margin: 0 auto 1.5rem auto;
      box-shadow: 0 10px 30px rgba(242, 231, 75, 0.4);
    }
    .step h3 { 
      color: white; 
      margin: 0 0 1rem 0; 
      font-size: 1.3rem;
      font-weight: 800;
    }
    .step p { 
      color: rgba(255, 255, 255, 0.7); 
      margin: 0;
      line-height: 1.6;
    }

    @media (max-width: 992px) {
      .hero-flex-layout {
        flex-direction: column;
        gap: 0.1rem;
        text-align: center;
        padding-top: 2rem;
      }
      .desktop-logo { display: none; }
      .mobile-logo { display: block; }
      .hero-left, .hero-right {
        width: 100%;
        text-align: center;
        justify-content: center;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .hero-logo {
        max-width: 280px;
      }
      .hero-title {
        font-size: 2.22rem;
      }
      .hero-subtitle {
        font-size: 1.1rem;
        margin-bottom: 2rem;
      }
      .code-card {
        padding: 1.5rem;
        width: 100%;
        max-width: 500px;
      }
      .code-input-group {
        flex-direction: column;
      }
      .redeem-btn {
        width: 100%;
      }
      .points-display {
        justify-content: center;
        width: 100%;
        max-width: 500px;
      }

    }
  `]
})
export class HomeComponent {
  code = '';
  submitting = signal(false);
  userPoints = signal(0);

  private router = inject(Router);
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  ngOnInit() {
    this.loadUserPoints();
  }

  loadUserPoints() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      this.http.get(`${environment.apiUrl}/user/points/${user.id}`).subscribe({
        next: (res: any) => {
          this.userPoints.set(res.points || 0);
        },
        error: () => {
          this.userPoints.set(0);
        }
      });
    }
  }

  redeemCode() {
    if (!this.code.trim()) {
      this.toastService.show('Por favor ingresa un codigo', 'error');
      return;
    }

    this.submitting.set(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    this.http.post(`${environment.apiUrl}/codes/redeem`, {
      code: this.code.toUpperCase(),
      user_id: user.id
    }).subscribe({
      next: (res: any) => {
        this.toastService.show(`¡Codigo canjeado! +${res.points} puntos`, 'success', 5000);
        this.code = '';
        this.loadUserPoints();
        this.submitting.set(false);
      },
      error: (err: any) => {
        this.toastService.show(err.error?.message || 'Error al canjear el codigo', 'error', 5000);
        this.submitting.set(false);
      }
    });
  }

  goToRewards() {
    this.router.navigate(['/rewards']);
  }

  goToProfile() {
    this.router.navigate(['/perfil']);
  }

  goToHistory() {
    this.router.navigate(['/historial']);
  }
}
