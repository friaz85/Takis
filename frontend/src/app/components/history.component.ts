import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { UserNavbarComponent } from './user-navbar.component';
import { WhatsappBubbleComponent } from './whatsapp-bubble.component';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, UserNavbarComponent, WhatsappBubbleComponent],
  template: `
    <user-navbar></user-navbar>
    <app-whatsapp-bubble></app-whatsapp-bubble>
    
    <div class="landing">
      <div class="hero">
        <div class="hero-flex">
          
          <!-- Left: Banderin -->
          <div class="hero-left">
            <div class="logo-wrapper">
              <img src="/assets/img/Banderin-completo.png" alt="Takis" class="takis-logo desktop-logo animate__animated animate__zoomIn">
              <img src="/assets/img/Banderin_01.png" alt="Takis" class="takis-logo mobile-logo animate__animated animate__zoomIn">
            </div>
          </div>
          
          <!-- Right: History Card -->
          <div class="hero-right history-card">
            
            <h1 class="history-title">MI <span class="highlight">HISTORIAL</span></h1>
            
            <!-- Rewards Table -->
            <div class="table-container custom-scroll">
              <table class="glass-table">
                <thead>
                  <tr>
                    <th>PREMIO</th>
                    <th>COSTO</th>
                    <th>ESTATUS</th>
                    <th>FECHA</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  <ng-container *ngFor="let reward of rewards()">
                    <tr>
                      <td class="reward-cell">
                        <div class="reward-mini">
                          <img [src]="reward.image_url ? environment.uploadsUrl + '/rewards/' + reward.image_url : 'assets/takis-piece.png'" alt="Img">
                          <span>{{ reward.title }}</span>
                        </div>
                      </td>
                      <td class="points-cell">-{{ reward.cost }}</td>
                      <td>
                        <span class="status-badge" [class]="reward.status">
                          {{ getStatusText(reward.status) }}
                        </span>
                      </td>
                      <td>{{ reward.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
                      <td>
                        <button 
                          *ngIf="reward.pdf_path && reward.status === 'completed'" 
                          (click)="reprintCoupon(reward)"
                          class="reprint-btn"
                          title="Reimprimir cupon">
                          🖨️ REIMPRIMIR
                        </button>
                        <span *ngIf="!reward.pdf_path || reward.status !== 'completed'" class="no-action">-</span>
                      </td>
                    </tr>
                    <!-- Tracking Row -->
                    <tr *ngIf="reward.tracking_number || reward.delivery_date" class="tracking-row">
                      <td colspan="5">
                        <div class="tracking-info">
                          <span *ngIf="reward.tracking_number">
                            📦 <strong>Guia:</strong> 
                            <a *ngIf="reward.tracking_url" [href]="reward.tracking_url" target="_blank">{{ reward.tracking_number }}</a>
                            <span *ngIf="!reward.tracking_url">{{ reward.tracking_number }}</span>
                          </span>
                          <span *ngIf="reward.delivery_date" class="delivery-date">
                            📅 <strong>Fecha estimada:</strong> {{ reward.delivery_date | date:'dd/MM/yyyy' }}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </ng-container>
                  <tr *ngIf="rewards().length === 0">
                    <td colspan="5" class="empty-cell">No has canjeado recompensas aun.</td>
                  </tr>
                </tbody>
              </table>
            </div>

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
      padding-top: 80px;
    }

    .hero { 
      padding: 1rem 2rem 4rem 2rem; 
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      z-index: 10;
    }

    .hero-flex {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      gap: 2rem;
    }

    .hero-left { flex: 0 0 300px; display: flex; justify-content: center; position: sticky; top: 100px; }
    
    .takis-logo { 
      width: 100%;
      height: auto;
      max-height: 85vh;
      object-fit: contain;
    }

    .hero-right {
      flex: 1;
      width: 100%;
    }

    .history-card {
      background: rgba(86, 14, 140, 0.8);
      border-radius: 2rem;
      padding: 3rem;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      text-align: center;
      position: relative;
      border: 1px solid rgba(242, 231, 75, 0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 600px;
    }

    .history-title {
        color: white;
        font-size: 2.5rem;
        font-weight: 900;
        text-transform: uppercase;
        margin-bottom: 2rem;
        text-shadow: 0 4px 10px rgba(0,0,0,0.5);
    }
    .highlight { color: #F2E74B; }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .tab {
      background: transparent;
      border: 2px solid white;
      color: white;
      padding: 0.8rem 2rem;
      border-radius: 2rem;
      font-size: 1.2rem;
      font-weight: 900;
      cursor: pointer;
      transition: 0.3s;
      text-transform: uppercase;
      font-family: 'TakisVeneer', 'Inter', sans-serif;
    }
    .tab:hover { background: rgba(255,255,255,0.1); }
    .tab.active {
      background: #F2E74B;
      color: #5d1f87;
      border-color: #F2E74B;
      box-shadow: 0 0 15px rgba(242, 231, 75, 0.4);
    }

    /* Table Styles */
    .table-container {
      width: 100%;
      overflow-x: auto;
      background: #00000075;
      border-radius: 1rem;
      padding: 1rem;
      max-height: 500px;
    }

    .glass-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0 0.5rem;
      color: white;
      text-align: left;
    }
    
    .glass-table th {
      padding: 1rem;
      color: #F2E74B;
      font-weight: 900;
      text-transform: uppercase;
      font-size: 1.1rem;
      border-bottom: 2px solid rgba(255,255,255,0.1);
    }

    .glass-table td {
      padding: 1rem;
      background: rgba(255,255,255,0.05);
      font-size: 1.1rem;
    }
    .glass-table tr td:first-child { border-top-left-radius: 0.5rem; border-bottom-left-radius: 0.5rem; }
    .glass-table tr td:last-child { border-top-right-radius: 0.5rem; border-bottom-right-radius: 0.5rem; }

    .code-cell {
      font-weight: 900;
      color: white;
      letter-spacing: 1px;
    }
    .points-cell {
      font-weight: 900;
      color: #F2E74B;
    }
    
    .reward-mini {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .reward-mini img {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 0.3rem;
    }

    .status-badge {
      padding: 0.3rem 0.8rem;
      border-radius: 2rem;
      font-weight: 800;
      font-size: 0.75rem;
      text-transform: uppercase;
    }
    .status-badge.completed { background: #00cc66; color: #1A0B2E; } /* Typically digital instant */
    .status-badge.pending { background: #ffaa00; color: #1A0B2E; }
    .status-badge.processing { background: #6C1DDA; color: white; }
    .status-badge.shipped { background: #00aaff; color: white; }
    .status-badge.delivered { background: #00cc66; color: white; }

    .empty-cell {
      text-align: center;
      padding: 3rem;
      color: rgba(255,255,255,0.5);
      font-style: italic;
    }

    .reprint-btn {
      background: #F2E74B;
      color: #5d1f87;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.8rem;
      font-weight: 900;
      cursor: pointer;
      transition: 0.3s;
      text-transform: uppercase;
      font-family: 'TakisVeneer', 'Inter', sans-serif;
    }
    .reprint-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(242, 231, 75, 0.4);
    }
    .no-action {
      color: rgba(255,255,255,0.3);
      font-style: italic;
    }

    .tracking-row td {
      background: rgba(242, 231, 75, 0.1) !important;
      padding: 0.5rem 1rem !important;
      border-top: 1px solid rgba(242, 231, 75, 0.2);
    }
    .tracking-info {
      display: flex;
      gap: 2rem;
      font-size: 0.9rem;
      color: #F2E74B;
    }
    .tracking-info a {
      color: white;
      text-decoration: underline;
    }
    .delivery-date {
      color: #00cc66;
    }

    /* Scroll */
    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #560E8C; border-radius: 3px; }

    /* Responsive */
    .mobile-logo { display: none; }

    @media (max-width: 992px) {
        .hero { padding: 1rem 0.5rem 4rem 0.5rem; }
        .hero-flex { flex-direction: column; align-items: center; gap: 1rem; }
        .hero-left { position: relative; top: 0; margin-bottom: 2rem; flex: auto; max-width: 100%; }
        
        .desktop-logo { display: none; }
        .mobile-logo { display: block; width: 100%; height: auto; max-width: 250px; }
        
        .history-card { padding: 2rem 0.5rem; min-height: auto; border-radius: 1.5rem; }
        .history-title { font-size: 2rem; }
        
        .table-container { padding: 0.2rem; }
        .glass-table th, .glass-table td { padding: 0.8rem 0.5rem; font-size: 0.8rem; }
        .reward-mini img { width: 30px; height: 30px; }
        .reprint-btn { font-size: 0.7rem; padding: 0.4rem 0.8rem; }
    }
  `]
})
export class HistoryComponent implements OnInit {
  rewards = signal<any[]>([]);

  private http = inject(HttpClient);
  environment = environment;

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    const session = JSON.parse(localStorage.getItem('takis_session') || '{}');
    const user = session.user;

    if (!user || (!user.id && !user.uid)) return;
    const userId = user.id || user.uid;

    // Load redeemed rewards
    this.http.get(`${environment.apiUrl}/user/rewards/${userId}`).subscribe({
      next: (res: any) => {
        this.rewards.set(Array.isArray(res) ? res : []);
      },
      error: () => {
        this.rewards.set([]);
      }
    });
  }

  reprintCoupon(reward: any) {
    if (reward.pdf_path) {
      const ext = reward.pdf_path.split('.').pop()?.toLowerCase();
      let path = 'redeemed';

      // If it's an image, it's a wallpaper and it's in templates
      if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
        path = 'templates';
      }

      const fileUrl = `${environment.uploadsUrl}/${path}/${reward.pdf_path}`;
      window.open(fileUrl, '_blank');
    }
  }

  getStatusText(status: string): string {
    const statusMap: any = {
      'completed': 'Entregado', // Digital usually
      'pending': 'Pendiente',
      'processing': 'En Proceso',
      'shipped': 'Enviado',
      'delivered': 'Entregado'
    };
    return statusMap[status] || status;
  }
}
