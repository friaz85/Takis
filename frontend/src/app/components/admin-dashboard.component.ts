import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AdminNavbarComponent } from './admin-navbar.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, AdminNavbarComponent],
  template: `
    <app-admin-navbar></app-admin-navbar>
    <div class="dashboard-page">
      <div class="header-row">
        <div>
           <h2 class="title">DASHBOARD</h2>
           <p class="subtitle">Visión general del rendimiento de la promoción</p>
        </div>
        <button class="export-btn" (click)="exportReport()">
           <span class="icon">📥</span> Exportar Reporte
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
      </div>

      <div class="content-grid">
        <!-- Top Rewards -->
        <div class="panel top-rewards">
          <h3>🏆 Top Recompensas</h3>
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
           <h3>⏱️ Últimos Movimientos</h3>
           <table class="simple-table">
             <thead>
               <tr>
                 <th>Usuario</th>
                 <th>Recompensa</th>
                 <th>Estado</th>
                 <th class="text-right">Fecha</th>
               </tr>
             </thead>
             <tbody>
               <tr *ngFor="let act of stats?.recent">
                 <td class="font-bold">{{ act.user }}</td>
                 <td>{{ act.reward }}</td>
                 <td>
                   <span class="status-pill" [class]="act.status">{{ act.status }}</span>
                 </td>
                 <td class="text-right text-sm text-gray">{{ act.created_at | date:'short' }}</td>
               </tr>
               <tr *ngIf="!stats?.recent?.length">
                  <td colspan="4" class="text-center">No hay actividad reciente</td>
               </tr>
             </tbody>
           </table>
        </div>
      </div>
      
      <!-- Chart Area (Simple CSS Bar Chart for "Last 7 Days") -->
      <div class="panel chart-panel" *ngIf="stats?.chart?.length">
         <h3>📊 Actividad (Últimos 7 días)</h3>
         <div class="bar-chart">
            <div class="bar-group" *ngFor="let day of stats?.chart">
               <div class="bar" [style.height.px]="(day.count / maxChartVal) * 150">
                  <span class="bar-val">{{ day.count }}</span>
               </div>
               <span class="bar-label">{{ day.date | date:'EE dd' }}</span>
            </div>
         </div>
      </div>

    </div>
  `,
  styles: [`
    .dashboard-page { padding: 3rem 3rem 3rem calc(260px + 3rem); background: transparent; min-height: 100vh; color: #E0E0E0; font-family: 'Inter', sans-serif; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .title { font-weight: 800; font-size: 2rem; margin: 0; color: white; letter-spacing: -1px; }
    .subtitle { color: #aaa; margin: 0.5rem 0 0 0; font-size: 0.9rem; }
    
    .export-btn { 
      background: #2D1B4E; border: 1px solid #6C1DDA; color: #fff; 
      padding: 0.8rem 1.5rem; border-radius: 0.5rem; cursor: pointer; 
      display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;
    }
    .export-btn:hover { background: #6C1DDA; }

    /* KPI Cards */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .kpi-card { 
      background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%); 
      border: 1px solid rgba(255,255,255,0.05); border-radius: 1rem; padding: 1.5rem; 
      display: flex; align-items: center; gap: 1.5rem; backdrop-filter: blur(10px);
      transition: transform 0.2s;
    }
    .kpi-card:hover { transform: translateY(-5px); border-color: rgba(255,255,255,0.2); }
    .kpi-icon { font-size: 2.5rem; background: rgba(0,0,0,0.2); width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 1rem; }
    .kpi-info h3 { margin: 0; font-size: 0.8rem; color: #aaa; text-transform: uppercase; letter-spacing: 1px; }
    .kpi-info .value { font-size: 2rem; font-weight: 800; color: white; line-height: 1.2; }
    
    .kpi-card.users .value { color: #4eff88; }
    .kpi-card.redemptions .value { color: #F2E74B; }
    .kpi-card.points .value { color: #64b5f6; }

    /* Grid Layout */
    .content-grid { display: grid; grid-template-columns: 350px 1fr; gap: 1.5rem; margin-bottom: 2rem; }
    
    .panel { background: #1A0B2E; border-radius: 1rem; padding: 1.5rem; border: 1px solid rgba(255,255,255,0.05); }
    .panel h3 { margin-top: 0; margin-bottom: 1.5rem; font-size: 1.1rem; color: white; display: flex; align-items: center; gap: 0.5rem; }

    /* Top Rewards */
    .ranking-list { list-style: none; padding: 0; margin: 0; }
    .ranking-list li { display: flex; align-items: center; padding: 0.8rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .ranking-list li:last-child { border-bottom: none; }
    .rank-num { font-weight: bold; color: #6C1DDA; width: 30px; }
    .rank-name { flex: 1; font-weight: 500; }
    .rank-val { font-size: 0.85rem; color: #aaa; }
    
    /* Table */
    .simple-table { width: 100%; border-collapse: collapse; text-align: left; }
    .simple-table th { color: #888; font-size: 0.75rem; text-transform: uppercase; padding-bottom: 1rem; border-bottom: 2px solid rgba(255,255,255,0.05); }
    .simple-table td { padding: 1rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem; }
    .status-pill { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; background: #333; }
    .status-pill.completed { background: rgba(50, 255, 100, 0.1); color: #4eff88; }
    .status-pill.pending { background: rgba(255, 200, 0, 0.1); color: #ffd700; }
    
    /* Chart */
    .chart-panel { margin-top: 2rem; }
    .bar-chart { display: flex; align-items: flex-end; gap: 2rem; height: 180px; padding-top: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .bar-group { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; flex: 1; }
    .bar { width: 40px; background: #6C1DDA; border-radius: 4px 4px 0 0; position: relative; transition: height 0.5s ease-out; min-height: 4px; }
    .bar:hover { background: #8a3ee6; }
    .bar-val { position: absolute; top: -20px; width: 100%; text-align: center; font-size: 0.8rem; font-weight: bold; color: white; }
    .bar-label { font-size: 0.8rem; color: #aaa; }

    @media (max-width: 1100px) {
       .content-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: any = null;
  maxChartVal = 1;
  private http = inject(HttpClient);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.http.get('https://takis.qrewards.com.mx/api/index.php/admin/stats').subscribe({
      next: (res: any) => {
        this.stats = res;
        if (this.stats.chart && this.stats.chart.length) {
          this.maxChartVal = Math.max(...this.stats.chart.map((d: any) => parseInt(d.count))) || 1;
        }
      },
      error: (e) => console.error(e)
    });
  }

  exportReport() {
    if (!this.stats) return;

    // Simple CSV Export of Recent Activity
    const headers = ['ID', 'User', 'Reward', 'Status', 'Date'];
    const rows = this.stats.recent.map((r: any) => [r.id, r.user, r.reward, r.status, r.created_at]);

    let csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map((e: any) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_takis_" + Date.now() + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
