import { Component, signal, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-rewards-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="catalog">
      <!-- Back Button -->
      <a routerLink="/" class="back-btn">← Volver al Inicio</a>

      <header>
        <h2 class="title">CATÁLOGO DE <span class="highlight">PREMIOS</span></h2>
      </header>
      
      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
         <div class="spinner"></div>
      </div>

      <div class="grid" *ngIf="!loading()">
        @for (item of rewards(); track item.id) {
          <div class="reward-card">
            
            <div class="card-img-container">
               <img [src]="item.image_url ? 'https://takis.qrewards.com.mx/api/uploads/rewards/' + item.image_url : 'assets/takis-piece.png'" alt="{{ item.title }}" class="reward-img">
            </div>

            <div class="points-badge">{{ item.cost | number }} PUNTOS</div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
            <button class="redeem-btn" [disabled]="item.stock <= 0">
              {{ item.stock > 0 ? 'CANJEAR' : 'AGOTADO' }}
            </button>
          </div>
        }
        @if (rewards().length === 0 && !loading()) {
           <div class="empty-state">
              <p>Pronto tendremos recompensas increíbles para ti.</p>
           </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .catalog { padding: 4rem 2rem; background: #1A0B2E; min-height: 100vh; position: relative; }
    
    .back-btn { 
      position: absolute; top: 2rem; left: 2rem; 
      color: rgba(255,255,255,0.7); text-decoration: none; 
      font-weight: bold; font-size: 0.9rem; transition: 0.2s;
      z-index: 10;
      background: rgba(0,0,0,0.2); padding: 0.5rem 1rem; border-radius: 2rem;
    }
    .back-btn:hover { color: #F2E74B; background: rgba(0,0,0,0.4); }

    .title { color: white; font-weight: 900; font-size: 2.5rem; text-align: center; margin-bottom: 4rem; text-shadow: 2px 2px 0 #6C1DDA; }
    .highlight { color: #F2E74B; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem; max-width: 1200px; margin: 0 auto; }
    
    .reward-card { background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 1.5rem; border: 2px solid #6C1DDA; position: relative; transition: 0.3s; overflow: hidden; display: flex; flex-direction: column; }
    .reward-card:hover { transform: translateY(-10px); background: rgba(108, 29, 218, 0.1); box-shadow: 0 10px 30px rgba(108, 29, 218, 0.2); }
    
    .card-img-container { height: 180px; width: 100%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
    .reward-img { max-height: 100%; max-width: 100%; object-fit: contain; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.5)); transition: 0.3s; }
    .reward-card:hover .reward-img { transform: scale(1.1); }

    .points-badge { position: absolute; top: 0; left: 0; background: #F2E74B; color: #1A0B2E; padding: 0.5rem 1rem; border-bottom-right-radius: 1rem; font-weight: 900; font-size: 0.8rem; z-index: 2; }
    h3 { color: white; margin: 1rem 0 0.5rem 0; font-weight: 900; font-size: 1.2rem; }
    p { color: #aaa; font-size: 0.9rem; margin-bottom: 2rem; flex: 1; line-height: 1.4; }
    .redeem-btn { width: 100%; padding: 1rem; background: transparent; border: 2px solid #F2E74B; color: #F2E74B; border-radius: 1rem; font-weight: 900; cursor: pointer; transition: 0.3s; margin-top: auto; }
    .redeem-btn:hover:not(:disabled) { background: #F2E74B; color: #1A0B2E; }
    .redeem-btn:disabled { border-color: #444; color: #444; cursor: not-allowed; }

    .loading-state { display: flex; justify-content: center; padding: 4rem; }
    .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #F2E74B; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; color: #888; grid-column: 1/-1; padding: 2rem; }
  `]
})
export class RewardsCatalogComponent implements OnInit {
  rewards = signal<any[]>([]);
  loading = signal(true);
  private http = inject(HttpClient);

  ngOnInit() {
    this.http.get('https://takis.qrewards.com.mx/api/index.php/rewards').subscribe({
      next: (res: any) => {
        this.rewards.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
