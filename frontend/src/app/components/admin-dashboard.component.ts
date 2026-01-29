import { Component, inject, OnInit, signal, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AdminNavbarComponent } from './admin-navbar.component';
import { Chart, registerables } from 'chart.js';
import { AdminLayoutService } from '../services/admin-layout.service';
import { environment } from '../../environments/environment';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbarComponent],
  template: `
    <app-admin-navbar></app-admin-navbar>
    <div class="dashboard-page" [class.sidebar-closed]="!layoutService.isSidebarOpen()">
      <div class="header-row">
        <div>
           <h2 class="title">DASHBOARD</h2>
           <p class="subtitle">Visión general del rendimiento de la promoción</p>
        </div>
        <button class="export-btn" (click)="exportFullReport()">
           <span class="icon">📥</span> <span class="btn-text">Exportar Reporte</span>
        </button>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card users">
           <div class="kpi-icon">👥</div>
           <div class="kpi-info">
             <h3>Usuarios</h3>
             <span class="value">{{ stats?.cards?.users | number }}</span>
           </div>
        </div>
        <div class="kpi-card redemptions">
           <div class="kpi-icon">🎟️</div>
           <div class="kpi-info">
             <h3>Canjes Totales</h3>
             <span class="value">{{ stats?.cards?.redemptions | number }}</span>
           </div>
        </div>
        <div class="kpi-card points">
           <div class="kpi-icon">⭐</div>
           <div class="kpi-info">
             <h3>Puntos Canjeados</h3>
             <span class="value">{{ stats?.cards?.points | number }}</span>
           </div>
        </div>
        <div class="kpi-card promo">
           <div class="kpi-icon">🎫</div>
           <div class="kpi-info">
             <h3>Códigos Promo</h3>
             <span class="value">{{ stats?.cards?.promo?.total | number }}</span>
             <small>{{ stats?.cards?.promo?.used }} usados</small>
           </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-row">
        <div class="panel chart-container">
          <h3>📊 Actividad de Canjes (7 días)</h3>
          <div class="canvas-wrapper">
            <canvas #activityChart></canvas>
          </div>
        </div>
        <div class="panel chart-container doughnut">
          <h3>🏆 Distribución de Premios</h3>
          <div class="canvas-wrapper">
            <canvas #rewardsChart></canvas>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <!-- Top Rewards Ranking -->
        <div class="panel top-rewards">
          <h3>📈 Ranking de Recompensas</h3>
          <ul class="ranking-list">
             <li *ngFor="let item of stats?.top_rewards; let i = index">
               <span class="rank-num">#{{ i + 1 }}</span>
               <span class="rank-name">{{ item.title }}</span>
               <span class="rank-val">{{ item.count }} canjes</span>
             </li>
             <li *ngIf="!stats?.top_rewards?.length" class="empty">Sin datos</li>
          </ul>
        </div>

        <!-- Recent Activity Table -->
        <div class="panel activity">
           <div class="panel-header">
              <h3>⏱️ Últimos Movimientos</h3>
              <div class="search-box">
                <input 
                  type="text" 
                  [ngModel]="searchTerm()" 
                  (ngModelChange)="searchTerm.set($event); currentPage = 1"
                  placeholder="Buscar actividad..."
                >
              </div>
           </div>

           <div class="table-wrapper">
             <table class="simple-table">
               <thead>
                 <tr>
                   <th>Usuario</th>
                   <th>Recompensa</th>
                   <th class="hide-mobile">Estado</th>
                   <th class="text-right">Fecha</th>
                 </tr>
               </thead>
               <tbody>
                 <tr *ngFor="let act of paginatedActivity()">
                   <td class="font-bold">{{ act.user }}</td>
                   <td>{{ act.reward }}</td>
                   <td class="hide-mobile">
                     <span class="status-pill" [class]="act.status">{{ act.status }}</span>
                   </td>
                   <td class="text-right text-sm text-gray">{{ act.created_at | date:'short' }}</td>
                 </tr>
                 <tr *ngIf="filteredActivity().length === 0">
                    <td colspan="4" class="text-center">No se encontraron resultados</td>
                 </tr>
               </tbody>
             </table>
           </div>

           <!-- Pagination -->
           <div class="pagination-footer" *ngIf="filteredActivity().length > 0">
              <span class="page-info">
                {{ (currentPage-1)*pageSize + 1 }} - {{ Math.min(currentPage*pageSize, filteredActivity().length) }} de {{ filteredActivity().length }}
              </span>
              <div class="page-controls">
                <button [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1">«</button>
                <span class="current-page">{{ currentPage }}</span>
                <button [disabled]="currentPage >= totalPages()" (click)="currentPage = currentPage + 1">»</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { 
      padding: 5rem 2rem 2rem 2rem; 
      margin-left: 260px;
      background: #0D0221; 
      min-height: 100vh; 
      color: white; 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .dashboard-page.sidebar-closed { margin-left: 0; padding-top: 5rem; }

    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; }
    .title { font-weight: 900; font-size: 2.5rem; margin: 0; color: #F2E74B; }
    .subtitle { color: #ccc; margin: 0.5rem 0 0 0; font-size: 0.95rem; }
    
    .export-btn { 
      background: #6C1DDA; border: none; color: #fff; padding: 0.75rem 1.5rem; border-radius: 0.5rem;
      cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: 0.3s; font-weight: bold;
      white-space: nowrap;
    }
    .export-btn .icon { color: #fff; }
    .export-btn:hover { background: #F2E74B; color: #1A0B2E; transform: translateY(-2px); }
    .export-btn:hover .icon { color: inherit; }

    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .kpi-card { 
      background: rgba(108, 29, 218, 0.1); border: 2px solid #6C1DDA; border-radius: 1rem;
      padding: 1.5rem; display: flex; align-items: center; gap: 1.5rem; transition: 0.3s;
    }
    .kpi-card:hover { transform: translateY(-5px); border-color: #F2E74B; }
    .kpi-icon { font-size: 2.5rem; background: rgba(0,0,0,0.3); width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 1rem; }
    .kpi-info h3 { margin: 0; font-size: 0.85rem; color: #ccc; text-transform: uppercase; letter-spacing: 1px; }
    .kpi-info .value { font-size: 2rem; font-weight: 900; color: #F2E74B; line-height: 1.2; display: block; }
    .kpi-info small { color: rgba(255,255,255,0.4); font-size: 0.8rem; display: block; margin-top: 2px; }

    .charts-row { display: grid; grid-template-columns: 2fr 1.2fr; gap: 1.5rem; margin-bottom: 2rem; }
    .chart-container { min-height: 350px; display: flex; flex-direction: column; }
    .canvas-wrapper { flex: 1; width: 100%; position: relative; display: flex; justify-content: center; align-items: center; padding: 1rem 0; min-height: 250px; }
    canvas { width: 100% !important; height: 100% !important; }

    .content-grid { display: grid; grid-template-columns: 350px 1fr; gap: 1.5rem; margin-bottom: 2rem; }
    .panel { background: rgba(255,255,255,0.05); border-radius: 1.5rem; padding: 1.5rem; border: 2px solid #6C1DDA; overflow: hidden; }
    .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }
    .panel h3 { margin: 0 0 1rem 0; font-size: 1.2rem; color: #F2E74B; font-weight: 900; width: 100%; border-bottom: 1px solid rgba(108, 29, 218, 0.2); padding-bottom: 0.5rem; }

    .search-box { flex: 1; min-width: 200px; }
    .search-box input {
      width: 100%; background: rgba(255,255,255,0.05); border: 1px solid #6C1DDA; color: white;
      padding: 0.5rem 1rem; border-radius: 0.5rem; outline: none; transition: 0.3s;
    }

    .ranking-list li { display: flex; align-items: center; padding: 0.8rem 0; border-bottom: 1px solid rgba(108, 29, 218, 0.2); }
    .rank-num { font-weight: 900; color: #F2E74B; width: 30px; font-size: 1rem; }
    .rank-name { flex: 1; font-weight: 500; font-size: 0.9rem; }

    .simple-table { width: 100%; border-collapse: collapse; }
    .simple-table th { color: #F2E74B; font-size: 0.75rem; text-transform: uppercase; padding: 1rem 0.5rem; text-align: left; font-weight: 900; border-bottom: 2px solid #6C1DDA; }
    .simple-table td { padding: 1rem 0.5rem; border-bottom: 1px solid rgba(108, 29, 218, 0.1); font-size: 0.85rem; }

    .pagination-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; }
    .page-controls { display: flex; align-items: center; gap: 0.5rem; }
    .page-controls button { background: #6C1DDA; border: none; color: white; width: 32px; height: 32px; border-radius: 0.4rem; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; }

    @media (max-width: 1100px) {
      .dashboard-page { margin-left: 0; padding: 5rem 1.5rem 2rem 1.5rem; }
      .header-row { flex-direction: column; align-items: flex-start; }
      .title { font-size: 2rem; }
      .kpi-grid { grid-template-columns: 1fr; }
      .charts-row { grid-template-columns: 1fr; }
      .content-grid { grid-template-columns: 1fr; }
      .hide-mobile { display: none; }
      .btn-text { display: none; }
      .export-btn { padding: 0.75rem; border-radius: 50%; width: 45px; height: 45px; justify-content: center; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  stats: any = null;
  searchTerm = signal('');
  currentPage = 1;
  pageSize = 5;
  Math = Math;

  private http = inject(HttpClient);
  public layoutService = inject(AdminLayoutService);

  @ViewChild('activityChart') activityChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rewardsChart') rewardsChartCanvas!: ElementRef<HTMLCanvasElement>;

  activityChart: Chart | null = null;
  rewardsChart: Chart | null = null;

  ngOnInit() {
    this.loadStats();
  }

  ngAfterViewInit() {
    if (this.stats) {
      this.initCharts();
    }
  }

  loadStats() {
    const mockData = {
      cards: { users: 1250, redemptions: 458, points: 125400 },
      top_rewards: [
        { title: 'Audífonos Bluetooth', count: 85 },
        { title: 'Mochila Takis Edición Especial', count: 62 },
        { title: 'Tarjeta de Regalo $500', count: 45 },
        { title: 'Sudadera Takis', count: 38 },
        { title: 'Gorra Takis', count: 25 }
      ],
      recent: [
        { id: 101, user: 'Carlos Ruiz', reward: 'Audífonos Bluetooth', status: 'completed', created_at: new Date().toISOString() },
        { id: 102, user: 'Elena Gómez', reward: 'Mochila Takis', status: 'pending', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 103, user: 'Marcos Soto', reward: 'Tarjeta Regalo', status: 'completed', created_at: new Date(Date.now() - 7200000).toISOString() },
        { id: 104, user: 'Lucía Méndez', reward: 'Sudadera Takis', status: 'pending', created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: 105, user: 'Roberto Paz', reward: 'Gorra Takis', status: 'completed', created_at: new Date(Date.now() - 172800000).toISOString() }
      ],
      chart: [
        { date: new Date(Date.now() - 518400000).toISOString(), count: 12 },
        { date: new Date(Date.now() - 432000000).toISOString(), count: 25 },
        { date: new Date(Date.now() - 345600000).toISOString(), count: 18 },
        { date: new Date(Date.now() - 259200000).toISOString(), count: 32 },
        { date: new Date(Date.now() - 172800000).toISOString(), count: 45 },
        { date: new Date(Date.now() - 86400000).toISOString(), count: 28 },
        { date: new Date().toISOString(), count: 35 }
      ]
    };

    this.http.get(`${environment.apiUrl}/admin/stats`).subscribe({
      next: (res: any) => {
        this.stats = {
          cards: {
            users: res.cards?.users || mockData.cards.users,
            redemptions: res.cards?.redemptions || mockData.cards.redemptions,
            points: res.cards?.points || mockData.cards.points
          },
          top_rewards: res.top_rewards?.length ? res.top_rewards : mockData.top_rewards,
          recent: res.recent?.length ? res.recent : mockData.recent,
          chart: res.chart?.length ? res.chart : mockData.chart
        };
        setTimeout(() => this.initCharts(), 0);
      },
      error: (e: any) => {
        console.error('API Error, using full mock data:', e);
        this.stats = mockData;
        setTimeout(() => this.initCharts(), 0);
      }
    });
  }

  initCharts() {
    if (!this.activityChartCanvas || !this.rewardsChartCanvas) return;

    if (this.activityChart) this.activityChart.destroy();
    if (this.rewardsChart) this.rewardsChart.destroy();

    const activityCtx = this.activityChartCanvas.nativeElement.getContext('2d');
    if (activityCtx) {
      this.activityChart = new Chart(activityCtx, {
        type: 'line',
        data: {
          labels: this.stats.chart.map((d: any) => {
            const date = new Date(d.date);
            return `${date.getDate()} ${date.toLocaleString('es-MX', { month: 'short' })}`;
          }),
          datasets: [{
            label: 'Canjes',
            data: this.stats.chart.map((d: any) => d.count),
            borderColor: '#F2E74B',
            backgroundColor: 'rgba(242, 231, 75, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#6C1DDA',
            pointBorderColor: '#F2E74B',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#ccc', font: { size: 10 } } },
            x: { grid: { display: false }, ticks: { color: '#ccc', font: { size: 10 } } }
          }
        }
      });
    }

    const rewardsCtx = this.rewardsChartCanvas.nativeElement.getContext('2d');
    if (rewardsCtx) {
      this.rewardsChart = new Chart(rewardsCtx, {
        type: 'doughnut',
        data: {
          labels: this.stats.top_rewards.map((r: any) => r.title),
          datasets: [{
            data: this.stats.top_rewards.map((r: any) => r.count),
            backgroundColor: ['#6C1DDA', '#F2E74B', '#ff4444', '#00cc66', '#00aaff'],
            borderWidth: 0,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#ccc', boxWidth: 10, font: { size: 10 } } }
          }
        }
      });
    }
  }

  filteredActivity = computed(() => {
    if (!this.stats?.recent) return [];
    const term = this.searchTerm().toLowerCase();
    return this.stats.recent.filter((a: any) =>
      a.user?.toLowerCase().includes(term) ||
      a.reward?.toLowerCase().includes(term) ||
      a.status?.toLowerCase().includes(term)
    );
  });

  paginatedActivity = computed(() => {
    const data = this.filteredActivity();
    const start = (this.currentPage - 1) * this.pageSize;
    return data.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredActivity().length / this.pageSize));

  exportFullReport() {
    if (!this.stats?.recent) return;
    const headers = ['ID', 'Usuario', 'Recompensa', 'Estado', 'Fecha'];
    const rows = this.stats.recent.map((r: any) => [r.id, `"${r.user}"`, `"${r.reward}"`, r.status, r.created_at]);
    const csvContent = "\ufeff" + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_dashboard_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
