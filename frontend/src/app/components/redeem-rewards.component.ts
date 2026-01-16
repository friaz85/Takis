import { Component, signal, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // Kept for safety if needed in navbar, but not used in template directly.
import { UserNavbarComponent } from './user-navbar.component';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-redeem-rewards',
    standalone: true,
    imports: [CommonModule, UserNavbarComponent], // Removed RouterLink if unused
    template: `
    <app-user-navbar></app-user-navbar>
    
    <div class="redeem-page">
      <div class="user-stats-bar">
         <div class="stats-content">
            <span class="label">TUS PUNTOS DISPONIBLES</span>
            <span class="points-val">{{ userPoints() | number }}</span>
         </div>
      </div>

      <div class="content-wrapper">
        <header>
            <h2 class="title">CANJEA TUS <span class="highlight">PREMIOS</span></h2>
        </header>

        <div *ngIf="loading()" class="loading-state">
            <div class="spinner"></div>
        </div>

        <div class="grid" *ngIf="!loading()">
            @for (item of rewards(); track item.id) {
            <div class="reward-card" [class.disabled]="item.stock <= 0 || item.cost > userPoints()">
                <div class="card-img-container">
                <img [src]="item.image_url ? 'https://takis.qrewards.com.mx/api/uploads/rewards/' + item.image_url : 'assets/takis-piece.png'" alt="{{ item.title }}" class="reward-img">
                </div>

                <div class="card-content">
                    <div class="cost-badge" [class.can-afford]="item.cost <= userPoints()">
                        {{ item.cost | number }} PTS
                    </div>
                    <h3>{{ item.title }}</h3>
                    <p>{{ item.description }}</p>

                    <div class="stock-info" *ngIf="item.stock < 5 && item.stock > 0">
                        ¡Solo quedan {{ item.stock }}!
                    </div>
                </div>
                
                <button class="redeem-btn" 
                    [disabled]="item.stock <= 0 || item.cost > userPoints() || processingId === item.id"
                    (click)="redeem(item)">
                    
                    @if (processingId === item.id) {
                        Canjeando...
                    } @else if (item.stock <= 0) {
                        AGOTADO
                    } @else if (item.cost > userPoints()) {
                        TE FALTAN {{ item.cost - userPoints() | number }} PTS
                    } @else {
                        CANJEAR AHORA
                    }
                </button>
            </div>
            }
        </div>
      </div>
    </div>
  `,
    styles: [`
    .redeem-page { padding-top: 80px; background: #1A0B2E; min-height: 100vh; color: white; }
    
    .user-stats-bar { 
       background: rgba(108, 29, 218, 0.2); border-bottom: 1px solid rgba(255,255,255,0.1); 
       padding: 1.5rem; text-align: center; position: sticky; top: 71px; z-index: 90; backdrop-filter: blur(10px);
    }
    .stats-content { display: inline-flex; flex-direction: column; align-items: center; }
    .label { font-size: 0.8rem; color: #aaa; letter-spacing: 2px; margin-bottom: 0.2rem; }
    .points-val { font-size: 2.5rem; font-weight: 900; color: #F2E74B; text-shadow: 0 0 20px rgba(242, 231, 75, 0.5); line-height: 1; }

    .content-wrapper { padding: 3rem 2rem; max-width: 1200px; margin: 0 auto; }
    .title { text-align: center; font-size: 2.5rem; font-weight: 900; margin-bottom: 3rem; }
    .highlight { color: #F2E74B; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem; }
    
    .reward-card { 
      background: rgba(255,255,255,0.03); border-radius: 1.5rem; border: 1px solid rgba(255,255,255,0.1); 
      overflow: hidden; display: flex; flex-direction: column; transition: 0.3s;
    }
    .reward-card.disabled { opacity: 0.6; filter: grayscale(0.5); }
    .reward-card:not(.disabled):hover { transform: translateY(-5px); border-color: #F2E74B; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }

    .card-img-container { height: 200px; padding: 1rem; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.2); }
    .reward-img { max-height: 100%; max-width: 100%; object-fit: contain; filter: drop-shadow(0 5px 10px rgba(0,0,0,0.5)); }

    .card-content { padding: 1.5rem; flex: 1; display: flex; flex-direction: column; }
    .cost-badge { align-self: flex-start; background: #333; color: #aaa; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 0.8rem; margin-bottom: 0.5rem; }
    .cost-badge.can-afford { background: #6C1DDA; color: white; }
    
    h3 { margin: 0 0 0.5rem 0; font-size: 1.2rem; font-weight: 800; line-height: 1.3; }
    p { color: #aaa; font-size: 0.9rem; line-height: 1.4; margin-bottom: 1rem; flex: 1; }
    .stock-info { color: #ff5555; font-size: 0.8rem; font-weight: bold; margin-bottom: 0.5rem; }

    .redeem-btn { 
      width: 100%; padding: 1.2rem; border: none; font-weight: 900; cursor: pointer; transition: 0.2s;
      background: #F2E74B; color: #1A0B2E; text-transform: uppercase; font-size: 0.9rem;
    }
    .redeem-btn:disabled { background: #333; color: #666; cursor: not-allowed; }
    .redeem-btn:not(:disabled):hover { background: #fff; }

    .loading-state { display: flex; justify-content: center; padding: 4rem; }
    .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #F2E74B; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class RedeemRewardsComponent implements OnInit {
    rewards = signal<any[]>([]);
    userPoints = signal(0);
    loading = signal(true);
    processingId: number | null = null;

    private http = inject(HttpClient);
    private toast = inject(ToastService);
    private auth = inject(AuthService);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.loading.set(true);
        // Get User Profile for Points
        this.http.get('https://takis.qrewards.com.mx/api/index.php/profile').subscribe({
            next: (profile: any) => {
                this.userPoints.set(parseInt(profile.user.points));

                // Get Rewards
                this.http.get('https://takis.qrewards.com.mx/api/index.php/rewards').subscribe({
                    next: (res: any) => {
                        this.rewards.set(res);
                        this.loading.set(false);
                    },
                    error: () => this.loading.set(false)
                });
            },
            error: () => {
                this.toast.show('Error cargando perfil', 'error');
                this.loading.set(false);
            }
        });
    }

    redeem(reward: any) {
        if (!confirm(`¿Canjear ${reward.title} por ${reward.cost} puntos?`)) return;

        this.processingId = reward.id;

        this.http.post('https://takis.qrewards.com.mx/api/index.php/redeem', { reward_id: reward.id }).subscribe({
            next: (res: any) => {
                this.toast.show('¡Canje exitoso! Disfruta tu premio.', 'success');
                this.processingId = null;
                this.loadData(); // Refresh points and stock

                // Optional: Open modal with redemption details/PDF
                if (res.pdf_url) {
                    window.open(res.pdf_url, '_blank');
                }
            },
            error: (err) => {
                this.processingId = null;
                const msg = err.error?.message || 'Error al canjear.';
                this.toast.show(msg, 'error');
            }
        });
    }
}
