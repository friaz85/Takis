import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { UserNavbarComponent } from './user-navbar.component';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { AnalyticsService } from '../services/analytics.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-redeem-rewards',
  standalone: true,
  imports: [CommonModule, UserNavbarComponent],
  template: `
    <user-navbar></user-navbar>
    
    <div class="redeem-page">
      <div class="user-stats-bar">
         <div class="points-display">
            <div class="points-icon">⭐</div>
            <div class="points-info">
              <span class="points-label">Tus puntos</span>
              <span class="points-value">{{ userPoints() | number }}</span>
            </div>
         </div>
      </div>

      <div class="glass-card main-card">
        <header class="redeem-header">
            <h2 class="takis-title">CANJEA TUS <span class="highlight">PREMIOS</span></h2>
            <p class="subtitle">Usa tus puntos para obtener recompensas exclusivas</p>
        </header>

        <!-- Tabs/Filters moved below title -->
        <div class="tabs">
          <button 
            class="tab" 
            [class.active]="activeFilter() === 'all'"
            (click)="activeFilter.set('all')"
          >
            🔍 TODOS
          </button>
          <button 
            class="tab" 
            [class.active]="activeFilter() === 'redeemable'"
            (click)="activeFilter.set('redeemable')"
          >
            🔥 CANJEABLES
          </button>
        </div>

        <div *ngIf="loading()" class="loading-state">
            <div class="spinner"></div>
        </div>

        <div class="grid" *ngIf="!loading()">
            @for (item of filteredRewards(); track item.id) {
            <div class="reward-card" [class.disabled]="item.stock <= 0">
                <div class="card-img-container">
                    <img [src]="item.image_url ? environment.uploadsUrl + '/rewards/' + item.image_url : 'assets/takis-piece.png'" alt="{{ item.title }}" class="reward-img">
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

        <!-- Empty State -->
        <div class="empty-state" *ngIf="filteredRewards().length === 0 && !loading()">
          <div class="icon">🎁</div>
          <h2>Sin resultados</h2>
          <p>{{ activeFilter() === 'redeemable' ? 'Aún no tienes puntos suficientes para estos premios.' : 'No hay premios disponibles en este momento.' }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .redeem-page { 
      padding: 6rem 2rem 2rem 2rem;
      background: transparent; 
      min-height: 100vh; 
      color: white; 
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }

    .glass-card { 
      background: #1c03387d; 
      backdrop-filter: blur(5px); 
      padding: 3rem; 
      border-radius: 2rem; 
      width: 95%; 
      max-width: 1200px;
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

    .redeem-header { text-align: center; margin-bottom: 2rem; }

    .subtitle { color: #aaa; text-align: center; margin-bottom: 2rem; font-size: 1.1rem; }
    .highlight { color: #F2E74B; }
    
    .user-stats-bar { 
       background: transparent; 
       padding: 0; 
       text-align: center; 
       display: flex;
       justify-content: center;
       margin-bottom: 3rem;
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

    .tabs {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .tab {
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(108, 29, 218, 0.3);
      color: white;
      padding: 1rem 2rem;
      border-radius: 1rem;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      transition: 0.3s;
    }
    .tab:hover {
      background: #57118cb5;
      backdrop-filter: blur(5px);
      border-color: rgba(242, 231, 75, 0.5);
    }
    .tab.active {
      background: linear-gradient(135deg, #F2E74B, #FFD700);
      border-color: #F2E74B;
      color: #1A0B2E;
      box-shadow: 0 10px 30px rgba(242, 231, 75, 0.4);
    }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2.5rem; }
    
    .reward-card { 
      background: #1c03387d; 
      backdrop-filter: blur(5px); 
      border-radius: 2rem; 
      border: 2px solid rgba(242, 231, 75, 0.2); 
      overflow: hidden; 
      display: flex; 
      flex-direction: column; 
      transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: pointer;
    }
    .reward-card.disabled { opacity: 0.6; filter: grayscale(0.2); }
    .reward-card:hover { 
      transform: translateY(-10px); 
      border-color: #F2E74B; 
      background: #57118cb5;
      backdrop-filter: blur(5px);
      box-shadow: 0 20px 50px rgba(0,0,0,0.6); 
    }
    .reward-card:active { transform: translateY(-5px) scale(0.98); }

    .card-img-container { height: 220px; padding: 1.5rem; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.2); }
    .reward-img { max-height: 100%; max-width: 100%; object-fit: contain; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.5)); transition: 0.3s; }
    .reward-card:hover .reward-img { transform: scale(1.05); }

    .card-content { padding: 2rem; flex: 1; display: flex; flex-direction: column; }
    .cost-badge { align-self: flex-start; background: rgba(255,255,255,0.1); color: #aaa; padding: 6px 14px; border-radius: 2rem; font-weight: 900; font-size: 0.9rem; margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.1); }
    .cost-badge.can-afford { background: rgba(242, 231, 75, 0.2); color: #F2E74B; border-color: #F2E74B; }
    
    h3 { margin: 0 0 0.8rem 0; font-size: 1.5rem; font-weight: 900; line-height: 1.2; color: white; }
    p { color: rgba(255,255,255,0.7); font-size: 1rem; line-height: 1.5; margin-bottom: 1.5rem; flex: 1; }
    .stock-info { color: #ff5555; font-size: 0.9rem; font-weight: 900; margin-bottom: 1rem; text-transform: uppercase; }

    .redeem-btn { 
      width: 100%; 
      padding: 1.4rem; 
      border: none; 
      font-weight: 950; 
      cursor: pointer; 
      transition: 0.3s;
      background: linear-gradient(135deg, #F2E74B, #FFD700);
      color: #1A0B2E; 
      text-transform: uppercase; 
      font-size: 1.1rem;
      letter-spacing: 1px;
    }
    .redeem-btn:disabled { background: #444; color: #888; cursor: not-allowed; }
    .redeem-btn:not(:disabled):hover { 
      background: white; 
      box-shadow: 0 -5px 20px rgba(242, 231, 75, 0.4);
    }

    .empty-state { text-align: center; padding: 5rem 2rem; grid-column: 1 / -1; }
    .empty-state .icon { font-size: 4rem; margin-bottom: 1rem; }
    .empty-state h2 { color: #F2E74B; font-weight: 900; }
    .empty-state p { color: #aaa; }

    .loading-state { display: flex; justify-content: center; padding: 6rem; }
    .spinner { width: 50px; height: 50px; border: 5px solid rgba(255,255,255,0.1); border-top-color: #F2E74B; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class RedeemRewardsComponent implements OnInit {
  rewards = signal<any[]>([]);
  activeFilter = signal<'all' | 'redeemable'>('all');
  userPoints = signal(0);
  loading = signal(true);
  processingId: number | null = null;

  filteredRewards = computed(() => {
    const filter = this.activeFilter();
    const pts = this.userPoints();
    const all = this.rewards();
    if (filter === 'redeemable') {
      return all.filter(r => r.cost <= pts && r.stock > 0);
    }
    return all;
  });

  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  private analytics = inject(AnalyticsService);
  environment = environment;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.http.get(`${environment.apiUrl}/profile`).subscribe({
      next: (profile: any) => {
        this.userPoints.set(parseInt(profile.user.points));
        this.http.get(`${environment.apiUrl}/rewards`).subscribe({
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

    this.http.post(`${environment.apiUrl}/redeem`, { reward_id: reward.id }).subscribe({
      next: (res: any) => {
        this.toast.show('¡Canje exitoso! Disfruta tu premio.', 'success');
        this.processingId = null;
        this.analytics.trackConversion('redemption', res.order_id || reward.id, {
          rewardTitle: reward.title,
          rewardPoints: reward.cost
        });
        this.loadData();
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
