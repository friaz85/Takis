import { Component, signal, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-public-catalog',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="catalog">
      <a routerLink="/" class="back-btn">← Volver al Inicio</a>
      
      <header class="hero-section">
        <h2 class="title">CATÁLOGO DE <span class="highlight">PREMIOS</span></h2>
        <p class="subtitle">Descubre las recompensas épicas que puedes ganar con Takis</p>
      </header>
      
      <div *ngIf="loading()" class="loading-state">
         <div class="spinner"></div>
      </div>

      <div class="grid" *ngIf="!loading()">
        @for (item of rewards(); track item.id) {
          <div class="reward-card">
            <div class="card-img-container">
               <img [src]="item.image_url ? 'https://takis.qrewards.com.mx/api/uploads/rewards/' + item.image_url : 'assets/takis-piece.png'" alt="{{ item.title }}" class="reward-img">
            </div>

            <div class="card-content">
                <h3>{{ item.title }}</h3>
                <div class="cost-tag">{{ item.cost | number }} PTS</div>
                <p>{{ item.description }}</p>
            </div>
            
            <a routerLink="/auth" class="action-btn">
               ¡LO QUIERO! <span class="small">(Registrarse)</span>
            </a>
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

    .hero-section { text-align: center; margin-bottom: 4rem; }
    .title { color: white; font-weight: 900; font-size: 3rem; margin: 0; text-shadow: 3px 3px 0 #6C1DDA; letter-spacing: -1px; }
    .subtitle { color: #aaa; margin-top: 1rem; font-size: 1.1rem; }
    .highlight { color: #F2E74B; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2.5rem; max-width: 1200px; margin: 0 auto; }
    
    .reward-card { 
      background: rgba(255,255,255,0.03); 
      border-radius: 1.5rem; 
      border: 1px solid rgba(255,255,255,0.1); 
      overflow: hidden; 
      display: flex; flex-direction: column;
      transition: all 0.3s ease;
    }
    .reward-card:hover { transform: translateY(-10px); background: rgba(255,255,255,0.06); border-color: #6C1DDA; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    
    .card-img-container { height: 220px; width: 100%; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at center, rgba(108, 29, 218, 0.2) 0%, transparent 70%); padding: 1rem; }
    .reward-img { max-height: 100%; max-width: 100%; object-fit: contain; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5)); transition: 0.4s; }
    .reward-card:hover .reward-img { transform: scale(1.1) rotate(5deg); }

    .card-content { padding: 1.5rem; flex: 1; text-align: center; }
    h3 { color: white; margin: 0 0 0.5rem 0; font-weight: 800; font-size: 1.4rem; line-height: 1.2; }
    .cost-tag { display: inline-block; background: #6C1DDA; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 0.8rem; margin-bottom: 1rem; }
    p { color: #ccc; font-size: 0.95rem; line-height: 1.5; margin: 0; }
    
    .action-btn { 
      display: block; text-align: center; padding: 1.2rem; 
      background: #F2E74B; color: #1A0B2E; text-decoration: none; 
      font-weight: 900; font-size: 1rem; transition: 0.2s;
    }
    .action-btn:hover { background: #fff; }
    .small { font-weight: normal; font-size: 0.8rem; opacity: 0.8; }

    .loading-state { display: flex; justify-content: center; padding: 4rem; }
    .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #F2E74B; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class PublicCatalogComponent implements OnInit {
    rewards = signal<any[]>([]);
    loading = signal(true);
    private http = inject(HttpClient);

    ngOnInit() {
        // Usa el endpoint público de rewards
        this.http.get('https://takis.qrewards.com.mx/api/index.php/rewards').subscribe({
            next: (res: any) => {
                this.rewards.set(res);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }
}
