import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { UserNavbarComponent } from './user-navbar.component';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, UserNavbarComponent],
  template: `
    <user-navbar></user-navbar>
    
    <div class="history-page">
      <div class="glass-card main-card">
        <div class="history-header">
          <h1 class="takis-title">MI <span class="highlight">HISTORIAL</span></h1>
          <p class="subtitle">Revisa todos tus canjes y recompensas</p>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button 
            class="tab" 
            [class.active]="activeTab() === 'codes'"
            (click)="activeTab.set('codes')"
          >
            🎫 Codigos Canjeados
          </button>
          <button 
            class="tab" 
            [class.active]="activeTab() === 'rewards'"
            (click)="activeTab.set('rewards')"
          >
            🎁 Recompensas Obtenidas
          </button>
        </div>

        <!-- Codes History -->
        <div class="content" *ngIf="activeTab() === 'codes'">
          <div class="cards-grid">
            <div class="history-card" *ngFor="let code of codes()">
              <div class="card-header">
                <span class="code-badge">{{ code.code }}</span>
                <span class="points-earned">+{{ code.points }} pts</span>
              </div>
              <div class="card-body">
                <p class="date">📅 {{ code.redeemed_at | date:'medium' }}</p>
              </div>
            </div>
            <div class="empty-state" *ngIf="codes().length === 0">
              <p>🔍 No has canjeado codigos aun</p>
              <small>Ingresa codigos en la pagina principal para acumular puntos</small>
            </div>
          </div>
        </div>

        <!-- Rewards History -->
        <div class="content" *ngIf="activeTab() === 'rewards'">
          <div class="cards-grid">
            <div class="reward-card" *ngFor="let reward of rewards()">
              <div class="reward-image">
                <img [src]="reward.image_url ? environment.uploadsUrl + '/rewards/' + reward.image_url : 'assets/takis-piece.png'" alt="{{ reward.title }}">
              </div>
              <div class="reward-info">
                <h3>{{ reward.title }}</h3>
                <div class="reward-meta">
                  <span class="cost">💰 {{ reward.points_cost }} puntos</span>
                  <span class="status" [class]="reward.status">
                    {{ getStatusText(reward.status) }}
                  </span>
                </div>
                <p class="date">📅 {{ reward.redeemed_at | date:'medium' }}</p>
              </div>
            </div>
            <div class="empty-state" *ngIf="rewards().length === 0">
              <p>🎁 No has canjeado recompensas aún</p>
              <small>Visita el catálogo para canjear tus puntos por premios increíbles</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .history-page {
      min-height: 100vh;
      background: transparent;
      padding: 6rem 2rem 2rem 2rem;
      display: flex;
      justify-content: center;
      align-items: flex-start;
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

    .history-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .subtitle { color: #aaa; text-align: center; margin-bottom: 2.5rem; font-size: 1.1rem; }
    .highlight { color: #F2E74B; }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-bottom: 3rem;
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

    /* Content */
    .content {
      max-width: 1200px;
      margin: 0 auto;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 2rem;
    }

    .history-card {
      background: #1c03387d;
      backdrop-filter: blur(5px);
      border: 2px solid rgba(242, 231, 75, 0.3);
      border-radius: 2rem;
      padding: 2rem;
      transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: pointer;
    }
    .history-card:hover {
      border-color: #F2E74B;
      transform: translateY(-10px);
      background: #57118cb5;
      backdrop-filter: blur(5px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .history-card:active { transform: translateY(-5px) scale(0.98); }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .code-badge {
      background: rgba(242, 231, 75, 0.2);
      color: #F2E74B;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 800;
      font-size: 0.9rem;
      letter-spacing: 1px;
    }
    .points-earned {
      background: linear-gradient(135deg, #00cc66, #00ff88);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 900;
      font-size: 1rem;
    }
    .card-body .date {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9rem;
      margin: 0;
    }

    /* Reward Card */
    .reward-card {
      background: #1c03387d;
      backdrop-filter: blur(5px);
      border: 2px solid rgba(242, 231, 75, 0.3);
      border-radius: 2rem;
      overflow: hidden;
      transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: pointer;
    }
    .reward-card:hover {
      border-color: #F2E74B;
      transform: translateY(-10px);
      background: #57118cb5;
      backdrop-filter: blur(5px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .reward-card:active { transform: translateY(-5px) scale(0.98); }
    .reward-image {
      width: 100%;
      height: 200px;
      overflow: hidden;
      background: rgba(0, 0, 0, 0.3);
    }
    .reward-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .reward-info {
      padding: 1.5rem;
    }
    .reward-info h3 {
      color: #F2E74B;
      margin: 0 0 1rem 0;
      font-size: 1.2rem;
      font-weight: 800;
    }
    .reward-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .cost {
      color: white;
      font-weight: 700;
      font-size: 0.9rem;
    }
    .status {
      padding: 0.3rem 0.8rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
    }
    .status.pending { background: #ffaa00; color: #1A0B2E; }
    .status.processing { background: #6C1DDA; color: white; }
    .status.shipped { background: #00aaff; color: white; }
    .status.delivered { background: #00cc66; color: white; }
    .reward-info .date {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.85rem;
      margin: 0;
    }

    /* Empty State */
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
      background: #1c03387d;
      backdrop-filter: blur(5px);
      border: 2px dashed rgba(242, 231, 75, 0.2);
      border-radius: 2rem;
    }
    .empty-state p {
      color: rgba(255, 255, 255, 0.7);
      font-size: 1.3rem;
      margin: 0 0 0.5rem 0;
    }
    .empty-state small {
      color: rgba(255, 255, 255, 0.5);
      font-size: 1rem;
    }

    @media (max-width: 768px) {
      .history-container { padding: 5rem 1rem 2rem 1rem; }
      .history-header h1 { font-size: 2rem; }
      .cards-grid { grid-template-columns: 1fr; }
      .tabs { flex-direction: column; }
      .tab { width: 100%; }
    }
  `]
})
export class HistoryComponent implements OnInit {
  activeTab = signal<'codes' | 'rewards'>('codes');
  codes = signal<any[]>([]);
  rewards = signal<any[]>([]);

  private http = inject(HttpClient);
  environment = environment;

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) return;

    // Load redeemed codes
    this.http.get(`${environment.apiUrl}/user/codes/${user.id}`).subscribe({
      next: (res: any) => {
        this.codes.set(Array.isArray(res) ? res : []);
      },
      error: () => {
        this.codes.set([]);
      }
    });

    // Load redeemed rewards
    this.http.get(`${environment.apiUrl}/user/rewards/${user.id}`).subscribe({
      next: (res: any) => {
        this.rewards.set(Array.isArray(res) ? res : []);
      },
      error: () => {
        this.rewards.set([]);
      }
    });
  }

  getStatusText(status: string): string {
    const statusMap: any = {
      'pending': 'Pendiente',
      'processing': 'En Proceso',
      'shipped': 'Enviado',
      'delivered': 'Entregado'
    };
    return statusMap[status] || status;
  }
}
