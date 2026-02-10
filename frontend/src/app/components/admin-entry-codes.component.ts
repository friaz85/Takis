import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AdminNavbarComponent } from './admin-navbar.component';
import { AdminLayoutService } from '../services/admin-layout.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin-entry-codes',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbarComponent],
  template: `
    <app-admin-navbar></app-admin-navbar>
    <div class="admin-page" [class.sidebar-closed]="!layoutService.isSidebarOpen()">
      <div class="header-row">
        <div>
           <h2 class="title">RECOMPENSAS CANJEADAS</h2>
           <p class="subtitle">Seguimiento de recompensas canjeadas por los usuarios</p>
        </div>
        <div class="header-actions">
          <button class="export-btn" (click)="exportToCSV()">
            <span class="icon">📥</span> <span class="btn-text">Exportar CSV</span>
          </button>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
           <div class="search-box">
             <input 
               type="text" 
               [ngModel]="searchTerm()" 
               (ngModelChange)="searchTerm.set($event); currentPage = 1"
               placeholder="Buscar por usuario o recompensa..."
             >
           </div>
        </div>

        <div class="table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Recompensa</th>
                <th class="hide-mobile">Tipo</th>
                <th class="hide-mobile">Puntos</th>
                <th>Estado</th>
                <th class="text-right">Fecha Canje</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let redemption of paginatedRedemptions()">
                <td class="font-bold">
                   {{ redemption.user_name }}
                   <small class="block text-gray hide-mobile">{{ redemption.user_email }}</small>
                </td>
                <td class="reward-cell">{{ redemption.reward_name }}</td>
                <td class="hide-mobile">
                  <span class="type-badge" [class.digital]="redemption.reward_type === 'digital'" [class.physical]="redemption.reward_type === 'physical'">
                    {{ redemption.reward_type === 'digital' ? 'Digital' : 'Física' }}
                  </span>
                </td>
                <td class="hide-mobile text-gold font-bold">{{ redemption.points_cost }} pts</td>
                <td>
                  <span class="status-badge" [class]="redemption.status">
                    {{ getStatusLabel(redemption.status) }}
                  </span>
                </td>
                <td class="text-right text-sm text-gray">{{ redemption.created_at | date:'short' }}</td>
              </tr>
              <tr *ngIf="filteredRedemptions().length === 0">
                 <td colspan="6" class="text-center py-8 text-gray">No se encontraron recompensas canjeadas</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" *ngIf="filteredRedemptions().length > 0">
          <div class="page-info">
             {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredRedemptions().length) }} de {{ filteredRedemptions().length }}
          </div>
          <div class="page-controls">
            <button [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1">«</button>
            <span class="current-page">{{ currentPage }}</span>
            <button [disabled]="currentPage >= totalPages()" (click)="currentPage = currentPage + 1">»</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { 
      padding: 5rem 2rem 2rem 2rem; 
      margin-left: 260px;
      min-height: 100vh;
      background: #0D0221;
      color: white; 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .admin-page.sidebar-closed { margin-left: 0; padding-top: 5rem; }

    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; }
    .title { font-weight: 900; font-size: 2rem; color: #F2E74B; margin: 0; }
    .subtitle { color: #ccc; margin: 0.5rem 0 0 0; }

    .export-btn { 
      background: #6C1DDA; border: none; color: white; padding: 0.75rem 1.5rem; 
      border-radius: 0.5rem; cursor: pointer; display: flex; align-items: center; 
      gap: 0.5rem; font-weight: bold; transition: 0.3s;
    }
    .export-btn .icon { color: #fff; }
    .export-btn:hover { background: #F2E74B; color: #1A0B2E; transform: translateY(-2px); }
    .export-btn:hover .icon { color: inherit; }

    .table-container { background: rgba(255,255,255,0.05); border: 2px solid #6C1DDA; border-radius: 1.5rem; overflow: hidden; }
    .table-header { padding: 1.5rem; border-bottom: 1px solid rgba(108, 29, 218, 0.2); }
    .search-box input {
      width: 100%; max-width: 400px; background: rgba(0,0,0,0.2); border: 1px solid #6C1DDA;
      color: white; padding: 0.8rem 1.2rem; border-radius: 0.5rem; outline: none;
    }

    .table-wrapper { overflow-x: auto; }
    .admin-table { width: 100%; border-collapse: collapse; }
    .admin-table th { background: rgba(108, 29, 218, 0.2); color: #F2E74B; padding: 1.2rem; text-align: left; font-size: 0.85rem; text-transform: uppercase; font-weight: 900; }
    .admin-table td { padding: 1.2rem; border-bottom: 1px solid rgba(108, 29, 218, 0.1); font-size: 0.9rem; }
    
    .reward-cell { color: #F2E74B; font-weight: bold; }
    
    .type-badge { 
      padding: 0.3rem 0.8rem; 
      border-radius: 0.5rem; 
      font-size: 0.75rem; 
      font-weight: bold; 
      text-transform: uppercase;
    }
    .type-badge.digital { background: rgba(108, 29, 218, 0.3); color: #F2E74B; }
    .type-badge.physical { background: rgba(0, 204, 102, 0.2); color: #00cc66; }
    
    .status-badge { 
      padding: 0.3rem 0.8rem; 
      border-radius: 0.5rem; 
      font-size: 0.75rem; 
      font-weight: bold; 
      text-transform: uppercase;
    }
    .status-badge.pending { background: rgba(255, 193, 7, 0.2); color: #ffc107; }
    .status-badge.completed { background: rgba(0, 204, 102, 0.2); color: #00cc66; }
    .status-badge.shipped { background: rgba(33, 150, 243, 0.2); color: #2196f3; }
    .status-badge.cancelled { background: rgba(244, 67, 54, 0.2); color: #f44336; }

    .pagination { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
    .page-controls { display: flex; align-items: center; gap: 1rem; }
    .page-controls button { background: #6C1DDA; border: none; color: white; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; }
    
    .text-gold { color: #F2E74B; }
    .block { display: block; }

    @media (max-width: 1100px) {
      .admin-page { margin-left: 0; padding: 5rem 1rem 2rem 1rem; }
      .header-row { flex-direction: column; align-items: flex-start; }
      .search-box input { max-width: 100%; }
      .hide-mobile { display: none; }
      .btn-text { display: none; }
      .export-btn { border-radius: 50%; width: 45px; height: 45px; padding: 0; justify-content: center; }
    }
  `]
})
export class AdminEntryCodesComponent implements OnInit {
  redemptions = signal<any[]>([]);
  searchTerm = signal('');
  currentPage = 1;
  pageSize = 10;
  Math = Math;

  private http = inject(HttpClient);
  public layoutService = inject(AdminLayoutService);

  ngOnInit() {
    this.loadRedemptions();
  }

  loadRedemptions() {
    this.http.get(`${environment.apiUrl}/admin/redemptions`).subscribe({
      next: (res: any) => {
        if (Array.isArray(res) && res.length > 0) {
          this.redemptions.set(res);
        } else {
          this.redemptions.set([]);
        }
      },
      error: (e: any) => {
        console.error('API redemptions error:', e);
        this.redemptions.set([]);
      }
    });
  }

  filteredRedemptions = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.redemptions().filter((r: any) =>
      r.user_name?.toLowerCase().includes(term) ||
      r.user_email?.toLowerCase().includes(term) ||
      r.reward_name?.toLowerCase().includes(term)
    );
  });

  paginatedRedemptions = computed(() => {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRedemptions().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredRedemptions().length / this.pageSize));

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'completed': 'Completado',
      'shipped': 'Enviado',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  }

  exportToCSV() {
    const headers = ['ID', 'Usuario', 'Email', 'Recompensa', 'Tipo', 'Puntos', 'Estado', 'Fecha'];
    const rows = this.filteredRedemptions().map((r: any) => [
      r.id,
      `"${r.user_name}"`,
      r.user_email,
      `"${r.reward_name}"`,
      r.reward_type === 'digital' ? 'Digital' : 'Física',
      r.points_cost,
      this.getStatusLabel(r.status),
      new Date(r.created_at).toLocaleString('es-MX')
    ]);

    const csvContent = "\ufeff" + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "recompensas_canjeadas_takis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
