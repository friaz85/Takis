import { Component, inject, OnInit, signal, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AdminNavbarComponent } from './admin-navbar.component';
import { Chart, registerables } from 'chart.js';
import { AdminLayoutService } from '../services/admin-layout.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbarComponent],
  template: `
    <app-admin-navbar></app-admin-navbar>
    <div class="dashboard-page" 
         [class.sidebar-closed]="!layoutService.isSidebarOpen()"
         [class.role-takis]="getRole() === 'takis'">
      <div class="header-row">
        <div>
           <h2 class="title">DASHBOARD DE RENDIMIENTO</h2>
           <p class="subtitle">Takis Aficion Intensa | {{ stats?.cards?.users | number }} Usuarios Registrados</p>
        </div>
        
        <div class="actions-group">
          <!-- Date Filter -->
          <div class="date-filter">
            <div class="date-input">
              <label>Desde</label>
              <input type="date" [(ngModel)]="startDate" (change)="loadStats()">
            </div>
            <div class="date-input">
              <label>Hasta</label>
              <input type="date" [(ngModel)]="endDate" (change)="loadStats()">
            </div>
          </div>

          <button class="export-btn" (click)="exportFullReport()">
             <span class="icon">📥</span> <span class="btn-text">Exportar Reporte</span>
          </button>
        </div>
      </div>

      <!-- KPI Cards -->
      <!-- KPI Cards - Single Row -->
      <div class="kpi-grid">
        <div class="kpi-card visits">
           <div class="kpi-icon">🌐</div>
           <div class="kpi-info">
             <h3>Visitas</h3>
             <span class="value">{{ stats?.cards?.visits | number }}</span>
             <small>Vistas de página</small>
           </div>
        </div>
        <div class="kpi-card users">
           <div class="kpi-icon">👥</div>
           <div class="kpi-info">
             <h3>Usuarios Registrados</h3>
             <span class="value">{{ stats?.cards?.users | number }}</span>
           </div>
        </div>
        <div class="kpi-card promo">
           <div class="kpi-icon">🎫</div>
           <div class="kpi-info">
             <h3>Códigos Registrados</h3>
             <span class="value">{{ stats?.cards?.promo?.used | number }}</span>
             <small>Códigos usados</small>
           </div>
        </div>
        <div class="kpi-card redemptions">
           <div class="kpi-icon">🎟️</div>
           <div class="kpi-info">
             <h3>Canjes Realizados</h3>
             <span class="value">{{ stats?.cards?.redemptions | number }}</span>
           </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-row">
        <div class="panel chart-container">
          <div class="chart-header">
            <h3>📊 Actividad (7 días)</h3>
            <div class="chart-toggles">
              <button [class.active]="showRedemptions" (click)="toggleMetric('redemptions')">Canjes</button>
              <button [class.active]="showUsers" (click)="toggleMetric('users')">Usuarios</button>
            </div>
          </div>
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


      <!-- Secondary Row: Visits (8/12) and Rewards (4/12) -->
      <div class="secondary-grid">
        <!-- Visits Log Table -->
        <div class="panel visits-panel" *ngIf="stats?.visits_log?.length">
           <div class="panel-header">
              <h3>🌐 Registro de Visitas Recientes</h3>
              <div class="header-actions">
                <div class="search-box miniature">
                  <input 
                    type="text" 
                    [ngModel]="visitsSearchTerm()" 
                    (ngModelChange)="visitsSearchTerm.set($event); visitsCurrentPage.set(1)"
                    placeholder="Filtrar visitas..."
                  >
                </div>
                <button class="mini-btn" (click)="exportVisits()" title="Exportar CSV">📥 CSV</button>
              </div>
           </div>

           <div class="table-wrapper">
               <table class="simple-table">
                   <thead>
                       <tr>
                           <th>Página</th>
                           <th>Usuario</th>
                           <th>IP</th>
                           <th class="text-right">Fecha</th>
                       </tr>
                   </thead>
                   <tbody>
                       <tr *ngFor="let v of paginatedVisits()">
                           <td class="text-xs truncate" style="max-width: 250px;" [title]="v.page_url">{{ v.page_url }}</td>
                           <td>{{ v.user || 'Anónimo' }}</td>
                           <td class="text-xs">{{ v.ip_address }}</td>
                           <td class="text-right text-xs text-gray">{{ v.created_at | date:'d MMM y, h:mm a' }}</td>
                       </tr>
                       <tr *ngIf="!filteredVisits().length" class="empty-row">
                         <td colspan="4">No se encontraron visitas</td>
                       </tr>
                   </tbody>
               </table>
           </div>

           <div class="pagination-footer" *ngIf="filteredVisits().length > 0">
              <span class="page-info">
                {{ (visitsCurrentPage()-1)*visitsPageSize + 1 }} - {{ Math.min(visitsCurrentPage()*visitsPageSize, filteredVisits().length) }} DE {{ filteredVisits().length }}
              </span>
              <div class="pagination-controls">
                <button [disabled]="visitsCurrentPage() === 1" (click)="setVisitsPage(visitsCurrentPage() - 1)">«</button>
                <span class="page-number">{{ visitsCurrentPage() }}</span>
                <button [disabled]="visitsCurrentPage() >= visitsTotalPages()" (click)="setVisitsPage(visitsCurrentPage() + 1)">»</button>
              </div>
           </div>
        </div>

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
      </div>

      <!-- Activity Row (Full Width) -->
      <div class="activity-row" *ngIf="canSeeActivity()">
        <div class="panel activity">
           <div class="panel-header">
              <h3>⏱️ Últimos Movimientos</h3>
              <div class="search-box">
                <input 
                  type="text" 
                  [ngModel]="searchTerm()" 
                  (ngModelChange)="searchTerm.set($event); currentPage.set(1)"
                  placeholder="Buscar actividad..."
                >
              </div>
           </div>

           <div class="table-wrapper">
             <table class="simple-table">
               <thead>
                 <tr>
                   <th>Usuario</th>
                   <th>Actividad</th>
                   <th class="hide-mobile">Tipo</th>
                   <th class="text-right">Fecha</th>
                 </tr>
               </thead>
               <tbody>
                 <tr *ngFor="let act of paginatedActivity()">
                   <td class="font-bold">{{ act.user }}</td>
                   <td>{{ act.reward }}</td>
                   <td class="hide-mobile">
                     <span class="status-pill gray">{{ act.status }}</span>
                   </td>
                   <td class="text-right text-sm text-gray">{{ act.created_at | date:'short' }}</td>
                 </tr>
                 <tr *ngIf="filteredActivity().length === 0">
                    <td colspan="4" class="text-center">No se encontraron resultados</td>
                 </tr>
               </tbody>
             </table>
           </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { 
      padding: 5rem 2rem 2rem 2rem; 
      margin-left: 260px;
      background: #0d0221d6; 
      min-height: 100vh; 
      color: white; 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .dashboard-page.sidebar-closed { margin-left: 0; padding-top: 5rem; }

    .header-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; flex-wrap: wrap; gap: 1.5rem; }
    .title { font-weight: 900; font-size: 2.5rem; margin: 0; color: #F2E74B; }
    .subtitle { color: #ccc; margin: 0.5rem 0 0 0; font-size: 0.95rem; }

    .actions-group { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    
    .date-filter { 
      display: flex; gap: 1rem; background: rgba(0,0,0,0.2); padding: 0.5rem 1rem; 
      border-radius: 0.5rem; border: 1px solid #6C1DDA; align-items: flex-end;
    }
    .date-input { display: flex; flex-direction: column; }
    .date-input label { font-size: 0.7rem; color: #ccc; text-transform: uppercase; font-weight: bold; margin-bottom: 0.2rem; }
    .date-input input { 
      background: transparent; border: none; color: white; font-family: inherit; 
      font-size: 0.95rem; outline: none; padding: 0.2rem 0; cursor: pointer;
    }
    .date-input input::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }

    .export-btn { 
      background: #6C1DDA; border: none; color: #fff; padding: 0.75rem 1.5rem; border-radius: 0.5rem;
      cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: 0.3s; font-weight: bold; height: 100%;
    }
    .export-btn:hover { background: #F2E74B; color: #1A0B2E; transform: translateY(-2px); }

    /* KPI CARDS */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
    .kpi-grid-secondary { grid-template-columns: repeat(2, 1fr); }
    .kpi-card { 
      background: rgba(108, 29, 218, 0.1); border: 2px solid #6C1DDA; border-radius: 1rem;
      padding: 1.5rem; display: flex; align-items: center; gap: 1.5rem; transition: 0.3s;
    }
    .kpi-card:hover { background: rgba(108, 29, 218, 0.2); border-color: #F2E74B; transform: translateY(-2px); }
    .kpi-icon { font-size: 2.5rem; flex-shrink: 0; }
    .kpi-info { flex: 1; min-width: 0; }
    .kpi-info h3 { margin: 0; font-size: 0.85rem; color: #ccc; text-transform: uppercase; letter-spacing: 1px; }
    .kpi-info .value { 
      font-size: 2rem; 
      font-weight: 900; 
      color: #F2E74B; 
      line-height: 1.2; 
      display: block; 
      word-break: break-word;
      overflow-wrap: break-word;
    }
    .kpi-info small { color: rgba(255,255,255,0.6); font-size: 0.8rem; display: block; margin-top: 4px; }

    /* CHARTS */
    .charts-row { display: grid; grid-template-columns: 2fr 1.2fr; gap: 1.5rem; margin-bottom: 2rem; }
    .chart-container { min-height: 400px; display: flex; flex-direction: column; }
    .canvas-wrapper { flex: 1; width: 100%; position: relative; padding: 1rem; min-height: 300px; }
    
    .chart-header { display: flex; justify-content: space-between; align-items: center; width: 100%; border-bottom: 1px solid rgba(108, 29, 218, 0.2); padding-bottom: 1rem; margin-bottom: 1rem; }
    .chart-header h3 { margin: 0; font-size: 1.2rem; color: #F2E74B; font-weight: 900; }
    .chart-toggles { display: flex; gap: 0.5rem; }
    .chart-toggles button {
      background: rgba(255,255,255,0.05); border: 1px solid #6C1DDA; color: #ccc;
      padding: 0.4rem 1rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.85rem; font-weight: bold; transition: 0.2s;
    }
    .chart-toggles button:hover { background: rgba(108, 29, 218, 0.3); }
    .chart-toggles button.active { background: #6C1DDA; color: white; border-color: #F2E74B; }

    .secondary-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
    .activity-row { margin-bottom: 2rem; }
    
    .panel { background: rgba(255,255,255,0.05); border-radius: 1.5rem; padding: 1.5rem; border: 2px solid #6C1DDA; overflow: hidden; }
    .panel h3 { margin: 0; font-size: 1.2rem; color: #F2E74B; font-weight: 900; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(108, 29, 218, 0.2); }
    .header-actions { display: flex; align-items: center; gap: 0.5rem; }
    .mini-btn { 
      background: #6C1DDA; color: white; border: none; padding: 0.4rem 0.8rem; 
      border-radius: 0.4rem; font-size: 0.75rem; font-weight: bold; cursor: pointer; transition: 0.2s;
    }
    .mini-btn:hover { background: #F2E74B; color: #1A0B2E; }
    .search-box.miniature input { padding: 0.4rem 0.8rem; font-size: 0.8rem; width: 150px; }

    .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }

    /* LISTS & TABLES */
    .ranking-list { list-style: none; padding: 0; margin: 0; }
    .ranking-list li { display: flex; align-items: center; padding: 1rem 0; border-bottom: 1px solid rgba(108, 29, 218, 0.2); }
    .ranking-list li:last-child { border-bottom: none; }
    .rank-num { font-weight: 900; color: #F2E74B; width: 35px; font-size: 1.1rem; }
    .rank-name { flex: 1; font-weight: 500; font-size: 0.95rem; }
    .rank-val { font-size: 0.85rem; color: #ccc; font-weight: bold; }

    .search-box { flex: 1; min-width: 200px; }
    .search-box input {
      width: 100%; background: rgba(0,0,0,0.2); border: 1px solid #6C1DDA; color: white;
      padding: 0.6rem 1rem; border-radius: 0.5rem; outline: none; transition: 0.3s;
    }
    .search-box input:focus { border-color: #F2E74B; background: rgba(108, 29, 218, 0.1); }

    .simple-table { width: 100%; border-collapse: collapse; }
    .simple-table th { color: #F2E74B; font-size: 0.75rem; text-transform: uppercase; padding: 1rem; text-align: left; font-weight: 900; border-bottom: 2px solid #6C1DDA; }
    .simple-table td { padding: 1rem; border-bottom: 1px solid rgba(108, 29, 218, 0.1); font-size: 0.9rem; }
    .status-pill { padding: 0.25rem 0.6rem; border-radius: 1rem; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; }
    .status-pill.gray { background: rgba(108, 117, 125, 0.3); color: #ccc; border: 1px solid #6c757d; }
    .status-pill.completed { background: #00cc66; color: #003319; }
    .status-pill.pending { background: #ffcc00; color: #332800; }
    .status-pill.cancelled { background: #ff4444; color: white; }

    .pagination-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; border-top: 1px solid rgba(108, 29, 218, 0.2); padding-top: 1rem; }
    
    .page-info { font-weight: 900; color: white; font-size: 0.9rem; text-transform: uppercase; }
    .pagination-controls { display: flex; align-items: center; gap: 0.75rem; }
    .pagination-controls button { 
      width: 36px; height: 36px; border-radius: 50%; background: #3A1A5E; border: none; color: #F2E74B; 
      display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.2rem; transition: 0.3s; 
    }
    .pagination-controls button:not(:disabled):hover { background: #6C1DDA; color: white; transform: scale(1.1); }
    .pagination-controls button:disabled { opacity: 0.3; cursor: not-allowed; }
    .page-number { font-weight: 900; color: #F2E74B; font-size: 1.1rem; margin: 0 0.5rem; }

    /* RESPONSIVE */
    @media (max-width: 900px) {
      .dashboard-page { margin-left: 0; padding: 5rem 1.5rem 2rem 1.5rem; }
      .header-row { flex-direction: row; flex-wrap: wrap; }
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .charts-row, .secondary-grid, .activity-row { grid-template-columns: 1fr; }
      .hide-mobile { display: none; }
    }

    @media (max-width: 600px) {
      .header-row { flex-direction: column; align-items: flex-start; gap: 1rem; }
      .actions-group { width: 100%; justify-content: space-between; }
      .date-filter { flex: 1; justify-content: space-around; }
      .kpi-grid { grid-template-columns: 1fr; }
    }

    /* PRINT STYLES - OPTIMIZED FOR PDF EXPORT */
    @media print {
      .dashboard-page { 
        margin-left: 0 !important; 
        padding: 20px 40px !important; 
        background: white !important; 
        color: black !important; 
        width: 100% !important;
        height: auto !important;
      }
      
      /* Hide Interactive Elements */
      app-admin-navbar, 
      .sidebar-bg, 
      .export-btn, 
      .page-controls, 
      .search-box, 
      .chart-toggles,
      .date-filter, 
      .pagination,
      .actions-group { 
        display: none !important; 
      }

      /* Hide restricted sections for takis role in report */
      .dashboard-page.role-takis .panel.activity {
        display: none !important;
      }

      /* Clean Header */
      .header-row { 
        margin-bottom: 2rem; 
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        border-bottom: 2px solid #000;
        padding-bottom: 15px;
      }
      .title { 
        color: black !important; 
        font-size: 20pt !important; 
        margin: 0 !important;
      }
      .subtitle { 
        color: #444 !important;
        font-size: 10pt !important; 
        margin: 0 !important;
        text-align: right;
      }

      /* KPI Grid - Compact */
      .kpi-grid { 
        display: grid !important;
        grid-template-columns: repeat(5, 1fr) !important; 
        gap: 15px !important; 
        margin-bottom: 30px !important; 
        page-break-inside: avoid;
      }
      
      .kpi-card { 
        border: 2px solid #000 !important; 
        background: #fff !important; 
        color: black !important; 
        box-shadow: none !important;
        padding: 12px 18px !important;
        border-radius: 12px !important;
        break-inside: avoid;
        text-align: center;
      }
      
      .kpi-icon { display: none !important; }
      
      .kpi-info h3 { 
        color: #666 !important; 
        font-size: 9pt !important;
        margin-bottom: 2px !important;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .kpi-info .value { 
        color: #000 !important; 
        font-size: 18pt !important;
        font-weight: bold !important;
      }
      
      .kpi-info small { display: none !important; }

      /* Charts - Side by Side and Compact */
      .charts-row { 
        display: grid !important; 
        grid-template-columns: 1.5fr 1fr !important; /* Activity chart wider */
        gap: 20px !important;
        margin-bottom: 25px !important;
        page-break-inside: avoid;
      }
      
      .panel { 
        border: 1px solid #ddd !important;
        border-radius: 12px !important;
        background: #fdfdfd !important; 
        color: black !important; 
        box-shadow: none !important;
        page-break-inside: avoid; 
        margin-bottom: 25px !important; 
        padding: 20px !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05) !important;
      }
      
      .panel h3 { 
        color: #000 !important; 
        border-bottom: 1px solid #eee !important; 
        padding-bottom: 8px !important;
        margin-bottom: 12px !important;
        font-size: 12pt !important;
      }

      /* Charts Sizing */
      .chart-container { 
        min-height: auto !important; 
        height: auto !important;
        display: block !important;
      }
      .canvas-wrapper {
        min-height: auto !important;
        height: 250px !important; /* Increased height for better visibility */
        width: 100% !important;
        background: #fff !important; /* White background for the chart itself */
        border-radius: 8px;
        padding: 10px;
        border: 1px solid #eee;
      }
      canvas { 
        max-height: 250px !important; 
        width: 100% !important;
      }

      /* Tables Compact */
      .ranking-list li { 
        border-bottom: 1px solid #eee !important; 
        padding: 6px 0 !important;
        color: black !important;
      }
      .rank-num { color: #000 !important; font-weight: bold; }
      .rank-val { color: #555 !important; }
      .rank-name { color: #333 !important; }

      .simple-table th { 
        color: #000 !important; 
        border-bottom: 2px solid #000 !important; 
        font-weight: bold;
        font-size: 9pt !important;
        padding: 8px !important;
      }
      .simple-table td { 
        color: #333 !important; 
        border-bottom: 1px solid #eee !important; 
        padding: 8px !important;
        font-size: 9pt !important;
      }
      
      .status-pill { border: 1px solid #ccc; background: #fff !important; color: #000 !important; padding: 2px 8px; font-size: 8pt; }
      
      /* Layout Adjustments */
      .content-grid { 
        display: block !important; /* Stack columns on print if needed or keep grid */
      }
      
      .top-rewards { 
        width: 100% !important;
        break-inside: avoid; 
      }

      .activity {
        width: 100% !important;
        break-inside: avoid;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  stats: any = null;
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 5;

  // Visits Table Pagination & Filter
  visitsSearchTerm = signal('');
  visitsCurrentPage = signal(1);
  visitsPageSize = 10;

  Math = Math;
  dataVersion = signal(0);

  setVisitsPage(page: number) {
    if (page >= 1 && page <= this.visitsTotalPages()) {
      this.visitsCurrentPage.set(page);
    }
  }

  canSeeActivity = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'quantum' || role === 'system_admin' || !role; // Default to see if no role or quantum
  });

  // Date Filters
  startDate: string = '';
  endDate: string = '';

  // Chart Toggles
  showRedemptions = true;
  showUsers = true;

  private http = inject(HttpClient);
  private auth = inject(AuthService);
  public layoutService = inject(AdminLayoutService);

  @ViewChild('activityChart') activityChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rewardsChart') rewardsChartCanvas!: ElementRef<HTMLCanvasElement>;

  activityChart: Chart | null = null;
  rewardsChart: Chart | null = null;

  ngOnInit() {
    // Init dates (Last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    this.startDate = start.toISOString().split('T')[0];
    this.endDate = end.toISOString().split('T')[0];

    this.loadStats();
  }

  ngAfterViewInit() {
    if (this.stats) {
      this.initCharts();
    }
  }

  loadStats() {
    const params: any = {};
    if (this.startDate) params.start_date = this.startDate;
    if (this.endDate) params.end_date = this.endDate;

    const mockData = {
      cards: { users: 1250, redemptions: 458, points: 125400, promo: { total: 1000, used: 850 } },
      success_rate: 98.5,
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
      chart: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 86400000).toISOString(),
        count: Math.floor(Math.random() * 50) + 10,
        users: Math.floor(Math.random() * 30) + 5
      }))
    };

    let url = `${environment.apiUrl}/admin/stats`;
    if (this.startDate && this.endDate) {
      url += `?start_date=${this.startDate}&end_date=${this.endDate}`;
    }

    this.http.get(url).subscribe({
      next: (res: any) => {
        this.stats = {
          cards: {
            users: res.cards?.users ?? mockData.cards.users,
            redemptions: res.cards?.redemptions ?? mockData.cards.redemptions,
            points: res.cards?.points ?? mockData.cards.points,
            visits: res.cards?.visits ?? 0, // Ensure visits is mapped
            promo: res.cards?.promo ?? mockData.cards.promo
          },
          success_rate: res.success_rate ?? mockData.success_rate,
          top_rewards: res.top_rewards?.length ? res.top_rewards : mockData.top_rewards,
          recent: res.recent || [],
          visits_log: res.visits_log || [],
          chart: res.chart?.length ? res.chart : mockData.chart
        };
        this.dataVersion.update(v => v + 1); // Force computed update
        setTimeout(() => this.initCharts(), 0);
      },
      error: (e: any) => {
        console.error('API Error, using full mock data:', e);
        this.stats = mockData; // Mock data doesn't have visits in the original code, maybe add it?
        (this.stats.cards as any).visits = 0;
        this.dataVersion.update(v => v + 1);
        setTimeout(() => this.initCharts(), 0);
      }
    });
  }

  toggleMetric(metric: 'redemptions' | 'users') {
    if (metric === 'redemptions') this.showRedemptions = !this.showRedemptions;
    if (metric === 'users') this.showUsers = !this.showUsers;
    this.initCharts();
  }

  initCharts() {
    if (!this.activityChartCanvas || !this.rewardsChartCanvas) return;

    if (this.activityChart) this.activityChart.destroy();
    if (this.rewardsChart) this.rewardsChart.destroy();

    const activityCtx = this.activityChartCanvas.nativeElement.getContext('2d');
    if (activityCtx) {
      const datasets = [];

      if (this.showRedemptions) {
        datasets.push({
          label: 'Canjes',
          data: this.stats.chart.map((d: any) => d.count),
          borderColor: '#F2E74B',
          backgroundColor: 'rgba(242, 231, 75, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6C1DDA',
          pointBorderColor: '#F2E74B'
        });
      }

      if (this.showUsers) {
        datasets.push({
          label: 'Usuarios Nuevos',
          data: this.stats.chart.map((d: any) => d.users || 0),
          borderColor: '#00cc66',
          backgroundColor: 'rgba(0, 204, 102, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#00cc66'
        });
      }

      this.activityChart = new Chart(activityCtx, {
        type: 'line',
        data: {
          labels: this.stats.chart.map((d: any) => {
            const date = new Date(d.date);
            return `${date.getDate()} ${date.toLocaleString('es-MX', { month: 'short' })}`;
          }),
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, labels: { color: '#ccc' } }
          },
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
    this.dataVersion(); // Dependency
    if (!this.stats?.recent) return [];
    const term = this.searchTerm().toLowerCase();
    return this.stats.recent.filter((a: any) =>
      a.user?.toLowerCase().includes(term) ||
      a.reward?.toLowerCase().includes(term) ||
      (a.status?.toLowerCase() || '').includes(term)
    );
  });

  paginatedActivity = computed(() => {
    const data = this.filteredActivity();
    const start = (this.currentPage() - 1) * this.pageSize;
    return data.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredActivity().length / this.pageSize));

  filteredVisits = computed(() => {
    this.dataVersion();
    if (!this.stats?.visits_log) return [];
    const term = this.visitsSearchTerm().toLowerCase();
    return this.stats.visits_log.filter((v: any) =>
      (v.page_url?.toLowerCase() || '').includes(term) ||
      (v.user?.toLowerCase() || '').includes(term) ||
      (v.ip_address?.toLowerCase() || '').includes(term)
    );
  });

  paginatedVisits = computed(() => {
    const data = this.filteredVisits();
    const start = (this.visitsCurrentPage() - 1) * this.visitsPageSize;
    return data.slice(start, start + this.visitsPageSize);
  });

  visitsTotalPages = computed(() => Math.ceil(this.filteredVisits().length / this.visitsPageSize));

  exportVisits() {
    const data = this.filteredVisits();
    if (!data.length) return;

    const headers = ['Página', 'Usuario', 'IP', 'Fecha'];
    const csvContent = [
      headers.join(','),
      ...data.map((v: any) => {
        const date = new Date(v.created_at).toLocaleString('es-MX');
        return `"${v.page_url}","${v.user || 'Anónimo'}","${v.ip_address}","${date}"`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `visitas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportFullReport() {
    window.print();
  }

  getRole() {
    return this.auth.user()?.role;
  }
}
