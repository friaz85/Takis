import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-public-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="catalog-page">
      <a routerLink="/" class="back-btn">← Volver</a>
      
      <div class="glass-card main-card">
        <div class="logo-container">
           <img src="assets/img/Banderin_01.png" alt="Takis" class="logo-img" (click)="goToHome()">
        </div>

        <h2 class="takis-title">CATALOGO DE <span class="highlight">PREMIOS</span></h2>
        <p class="subtitle">Descubre todo lo que puedes ganar con Takis</p>

        <div class="auth-box-actions">
           <button class="takis-btn outline" (click)="goToLogin()">INICIAR SESION</button>
           <button class="takis-btn primary" (click)="goToRegister()">REGISTRARME</button>
        </div>

        <div *ngIf="loading()" class="loading-state">
            <div class="spinner"></div>
            <p>Cargando premios...</p>
        </div>

        <div class="rewards-grid" *ngIf="!loading()">
          <div class="reward-card" *ngFor="let reward of rewards()">
            <div class="reward-image">
              <img [src]="reward.image_url ? environment.uploadsUrl + '/rewards/' + reward.image_url : 'assets/takis-piece.png'" [alt]="reward.title">
              <div class="reward-points">{{ reward.cost }} <small>PTS</small></div>
            </div>
            <div class="reward-info">
              <h3>{{ reward.title }}</h3>
              <p>{{ reward.description }}</p>
              <button class="takis-btn buy-btn" (click)="goToLogin()">¡LO QUIERO!</button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="rewards().length === 0 && !loading()">
          <div class="icon">🎁</div>
          <h2>Proximamente...</h2>
          <p>Estamos preparando premios increibles para ti.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .catalog-page { 
      min-height: 100vh; 
      background: transparent; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      padding: 6rem 1rem 2rem 1rem; 
      position: relative; 
    }
    
    .back-btn { 
      position: absolute; top: 2rem; left: 2rem; 
      color: rgba(255,255,255,0.7); text-decoration: none; 
      font-weight: bold; font-size: 0.9rem; transition: 0.2s;
      z-index: 100;
    }
    .back-btn:hover { color: #F2E74B; transform: translateX(-5px); }

    .auth-box-actions { 
      position: absolute;
      top: 1.5rem;
      right: 2rem;
      display: flex; 
      gap: 1rem; 
      z-index: 100;
    }

    .glass-card { 
      background: #1c03387d; 
      backdrop-filter: blur(5px); 
      padding: 3rem; 
      border-radius: 2rem; 
      width: 95%; 
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

    .logo-container { text-align: center; margin-bottom: 1.5rem; }
    .logo-img { width: 140px; cursor: pointer; filter: drop-shadow(0 0 10px rgba(108, 29, 218, 0.5)); transition: 0.3s; }
    .logo-img:hover { transform: scale(1.05); }


    .subtitle { color: #aaa; text-align: center; margin-bottom: 2.5rem; font-size: 1.1rem; }
    .highlight { color: #F2E74B; }



    .takis-btn { 
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.8rem 2rem; 
      min-height: 50px;
      border-radius: 1rem; 
      font-weight: 900; 
      text-decoration: none; 
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
      font-size: 1rem; 
      text-align: center;
      border: none;
      cursor: pointer;
      text-transform: uppercase;
    }

    .primary { 
      background: #F2E74B; 
      color: #1A0B2E; 
      box-shadow: 0 6px 0 #b3ab37, 0 10px 20px rgba(242, 231, 75, 0.2); 
    }

    .primary:hover { 
      transform: translateY(-3px); 
      box-shadow: 0 8px 0 #b3ab37, 0 12px 25px rgba(242, 231, 75, 0.3); 
    }

    .outline {
      border: 3px solid #F2E74B !important;
      color: #F2E74B;
      background: rgba(242, 231, 75, 0.05);
    }

    .outline:hover {
      background: rgba(242, 231, 75, 0.1);
      transform: translateY(-3px);
      box-shadow: 0 10px 20px rgba(242, 231, 75, 0.2);
    }

    /* Grid */
    .rewards-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); 
      gap: 2rem; 
    }
    
    .reward-card { 
      background: #1c03387d; 
      backdrop-filter: blur(5px);
      border: 2px solid rgba(242, 231, 75, 0.2); 
      border-radius: 2rem; 
      overflow: hidden; 
      transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
      display: flex;
      flex-direction: column;
      cursor: pointer;
    }
    
    .reward-card:hover { 
      transform: translateY(-10px); 
      border-color: #F2E74B; 
      background: #57118cb5;
      backdrop-filter: blur(5px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .reward-card:active { transform: translateY(-5px) scale(0.98); }
    
    .reward-image { position: relative; height: 180px; overflow: hidden; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .reward-image img { max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.5)); }
    
    .reward-points { position: absolute; top: 1rem; right: 1rem; background: #F2E74B; color: #1A0B2E; padding: 0.4rem 0.8rem; border-radius: 2rem; font-weight: 900; font-size: 1rem; }
    
    .reward-info { padding: 1.5rem; text-align: center; flex: 1; display: flex; flex-direction: column; }
    .reward-info h3 { color: #fff; margin: 0 0 0.5rem 0; font-size: 1.2rem; font-weight: 800; }
    .reward-info p { color: #aaa; font-size: 0.85rem; margin-bottom: 1.5rem; flex: 1; line-height: 1.4; }
    
    .buy-btn { 
      width: 100%; 
      background: #F2E74B; 
      color: #1A0B2E; 
      margin-top: 1rem;
      box-shadow: 0 5px 0 #b3ab37;
    }
    .buy-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 0 #b3ab37, 0 10px 20px rgba(242, 231, 75, 0.4); }

    .loading-state, .empty-state { text-align: center; padding: 3rem 0; }
    .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #F2E74B; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state .icon { font-size: 4rem; margin-bottom: 1rem; }

    @media (max-width: 768px) {
      .title { font-size: 2rem; }
      .glass-card { padding: 1.5rem; }
      .auth-box-actions { 
        position: static;
        margin-bottom: 2rem;
        flex-direction: column; 
        width: 100%;
      }
      .takis-btn { width: 100%; }
      .catalog-page { padding-top: 8rem; }
    }
  `]
})
export class PublicCatalogComponent implements OnInit {
  rewards = signal<any[]>([]);
  loading = signal(true);
  private http = inject(HttpClient);
  private router = inject(Router);
  environment = environment;

  ngOnInit() {
    this.loadRewards();
  }

  loadRewards() {
    this.http.get(`${environment.apiUrl}/rewards`).subscribe({
      next: (res: any) => {
        this.rewards.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  goToLogin() { this.router.navigate(['/auth/login']); }
  goToRegister() { this.router.navigate(['/auth/register']); }
  goToHome() { this.router.navigate(['/']); }
}
