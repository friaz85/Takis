import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';
import { UserNavbarComponent } from './user-navbar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-public-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink, UserNavbarComponent],
  template: `
    <user-navbar></user-navbar>
    
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
          
          <!-- Right: Catalog Card -->
          <div class="hero-right catalog-card">
            
            <!-- Points Header Bar -->
            <div class="points-header">
                <span class="ph-label">TIENES</span>
                <span class="ph-value">{{ userPoints() | number:'1.0-0' }}</span>
                <span class="ph-label">PUNTOS DISPONIBLES</span>
            </div>

            <h2 class="catalog-title">CATALOGO DE RECOMPENSAS</h2>
            
            <!-- Filter Tabs -->
            <div class="filter-tabs">
                <button 
                  class="filter-btn" 
                  [class.active]="activeFilter() === 'all'" 
                  (click)="setFilter('all')">
                  TODOS
                </button>
                <button 
                  class="filter-btn" 
                  [class.active]="activeFilter() === 'redeemable'" 
                  (click)="setFilter('redeemable')">
                  CANJEABLES
                </button>
            </div>
            
            <div *ngIf="loading()" class="loading-state">
                <div class="spinner"></div>
                <p>CARGANDO CATALOGO...</p>
            </div>

            <div class="rewards-grid custom-scroll" *ngIf="!loading()">
              <div class="reward-item" *ngFor="let reward of visibleRewards()">
                <div class="reward-img-container">
                    <img [src]="reward.image_url ? environment.uploadsUrl + '/rewards/' + reward.image_url : 'assets/takis-piece.png'" [alt]="reward.title">
                </div>
                <h3 class="reward-title">{{ reward.title }}</h3>
                <div class="reward-pts">{{ reward.cost | number }} PTS</div>
                
                <!-- Button only visible if filter is 'redeemable' (implies can afford) -->
                <button 
                  *ngIf="activeFilter() === 'redeemable'"
                  class="redeem-btn-sm" 
                  (click)="redeem(reward)">
                  LO QUIERO
                </button>
                
                <!-- View Only badge for 'all' -->
                <span *ngIf="activeFilter() === 'all'" class="view-only-badge">
                   {{ reward.cost > userPoints() ? 'Insuficientes Puntos' : 'Disponible en Canjeables' }}
                </span>
              </div>
            </div>

            <!-- Empty State -->
            <div class="empty-state" *ngIf="visibleRewards().length === 0 && !loading()">
              <h2>{{ activeFilter() === 'redeemable' ? 'Aun no te alcanzan recompensas. Sigue participando!' : 'Proximamente...' }}</h2>
            </div>
            
             <!-- Corner Logo (Desktop Only) -->
            <img src="/assets/img/Logo-Takis.png" class="corner-logo" alt="Takis Logo">
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
      max-width: 1400px; /* Wider for catalog */
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

    .catalog-card {
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

    /* Points Header */
    .points-header {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        padding: 0.8rem 2rem;
        display: inline-flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
        border: 1px solid rgba(255,255,255,0.2);
    }
    .ph-label { color: white; font-weight: 900; font-size: 1.2rem; text-transform: uppercase; letter-spacing: 1px; }
    .ph-value { color: white; font-weight: 900; font-size: 2rem; }

    .catalog-title {
        color: #f2e74b;
        font-size: 3rem;
        font-weight: 900;
        text-transform: uppercase;
        margin-bottom: 1rem;
        text-shadow: 0 4px 10px rgba(0, 0, 0, .5);
        letter-spacing: 2px;
        background: url(/assets/img/texture-gold.jpg);
        background-size: cover;
        -webkit-background-clip: text;
    }

    .filter-tabs {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        background: rgba(255,255,255,0.1);
        padding: 0.5rem;
        border-radius: 1rem;
    }
    .filter-btn {
        background: transparent;
        color: white;
        border: none;
        padding: 0.8rem 2rem;
        border-radius: 0.8rem;
        font-weight: 900;
        cursor: pointer;
        transition: 0.3s;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 1.1rem;
        font-family: 'TakisVeneer', 'Inter', sans-serif;
    }
    .filter-btn:hover { background: rgba(255,255,255,0.05); }
    .filter-btn.active {
        background: #F2E74B;
        color: #5d1f87;
    }
    .view-only-badge {
        font-size: 0.75rem;
        color: #ddd;
        margin-top: 0.5rem;
        /* background: rgba(0,0,0,0.5); */
        /* padding: 4px 8px; */
        /* border-radius: 4px; */
    }

    /* Grid */
    .rewards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 2rem;
        width: 100%;
        max-height: 600px;
        overflow-y: auto;
        padding-right: 1rem;
    }

    .overlay-hover {
        background: #1f0235c7;
    }
    
    /* Scrollbar styling */
    .custom-scroll::-webkit-scrollbar { width: 8px; }
    .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #F2E74B; border-radius: 4px; }

    .reward-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        transition: 0.3s;
    }
    .reward-item:hover { transform: translateY(-5px); }

    .reward-img-container {
        width: 100%;
        height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;
    }
    .reward-img-container img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 5px 10px rgba(0,0,0,0.5));
    }

    .reward-title {
        color: white;
        font-size: 1.1rem;
        font-weight: 900;
        text-transform: uppercase;
        margin-bottom: 0.5rem;
        line-height: 1.2;
        min-height: 2.4em; /* 2 lines preserved */
    }

    .reward-pts {
        color: #F2E74B;
        font-size: 1.1rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
    }

    .redeem-btn-sm {
        background: #F2E74B;
        color: #5d1f87;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-weight: 900;
        font-size: 0.8rem;
        cursor: pointer;
        text-transform: uppercase;
        width: 100%;
        transition: 0.2s;
        font-family: 'TakisVeneer', 'Inter', sans-serif;
    }
    .redeem-btn-sm:hover {
        background: white;
    }

    .corner-logo {
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 80px;
      height: auto;
      filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3));
      z-index: 10;
    }

    .loading-state, .empty-state { text-align: center; color: white; padding: 3rem; }
    .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #F2E74B; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Responsive */
    .mobile-logo { display: none; }

    @media (max-width: 992px) {
        .hero-flex { flex-direction: column; align-items: center; }
        .hero-left { position: relative; top: 0; margin-bottom: 2rem; flex: auto; max-width: 100%; }
        
        .desktop-logo { display: none; }
        .mobile-logo { display: block; width: 100%; height: auto; max-width: 280px; }
        .corner-logo { display: none; }
        
        .catalog-card { padding: 2rem 1rem; min-height: auto; }
        .rewards-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; padding-right: 0; max-height: none; overflow-y: visible; }
        
        .points-header { width: 100%; justify-content: center; padding: 1rem; flex-direction: column; gap: 0.5rem; }
        .ph-value { font-size: 2.5rem; }
    }
  `]
})
export class PublicCatalogComponent implements OnInit {
  rewards = signal<any[]>([]);
  loading = signal(true);
  userPoints = signal(0);
  activeFilter = signal<'all' | 'redeemable'>('all');

  private http = inject(HttpClient);
  private router = inject(Router);
  environment = environment;

  // Computed rewards based on filter
  visibleRewards = computed(() => {
    const list = this.rewards();
    const filter = this.activeFilter();
    const points = this.userPoints();

    if (filter === 'redeemable') {
      return list.filter(r => r.cost <= points);
    }
    // 'all' shows everything
    return list;
  });

  ngOnInit() {
    this.loadUserPoints();
    this.loadRewards();
  }

  loadUserPoints() {
    const session = localStorage.getItem('takis_session');
    if (session) {
      try {
        const user = JSON.parse(session).user;
        // Fetch fresh points
        this.http.get(`${environment.apiUrl}/user/points/${user.id}`).subscribe({
          next: (res: any) => this.userPoints.set(res.points || 0),
          error: () => this.userPoints.set(0)
        });
      } catch (e) { }
    }
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

  redeem(reward: any) {
    if (!localStorage.getItem('takis_token')) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Prevent redemption if we are in 'all' view and points are insufficient (though button should be disabled preferably)
    if (reward.cost > this.userPoints()) {
      Swal.fire({
        title: 'Puntos insuficientes',
        text: 'No tienes suficientes puntos para esta recompensa.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#6C1DDA',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)',
        color: '#333',
        iconColor: '#F2E74B',
        customClass: {
          popup: 'takis-swal-popup',
          confirmButton: 'takis-swal-button'
        },
        buttonsStyling: false
      });
      return;
    }

    // Logic for redemption detailed in next steps or separate navigation
    this.router.navigate(['/redeem', reward.id]);
  }

  setFilter(filter: 'all' | 'redeemable') {
    this.activeFilter.set(filter);
  }
}
