import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AdminNavbarComponent } from './admin-navbar.component';
import { AdminLayoutService } from '../services/admin-layout.service';
import { ToastService } from '../services/toast.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin-promo-codes',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbarComponent],
  template: `
    <app-admin-navbar></app-admin-navbar>
    <div class="admin-page" [class.sidebar-closed]="!layoutService.isSidebarOpen()">
      <div class="header-row">
        <div>
          <h2 class="title">CÓDIGOS PROMOCIONALES</h2>
          <p class="subtitle">Gestiona los códigos de entrada para los usuarios</p>
        </div>
        <button class="export-btn" (click)="loadCodes()">
          <span class="icon">🔄</span> <span class="btn-text">Refrescar</span>
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <span class="stat-label">Total Códigos</span>
            <span class="stat-value">{{ (totalAvailable() + totalUsed()).toLocaleString() }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <span class="stat-label">Disponibles</span>
            <span class="stat-value">{{ totalAvailable().toLocaleString() }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-info">
            <span class="stat-label">Usados</span>
            <span class="stat-value">{{ totalUsed().toLocaleString() }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <span class="stat-label">Puntos por Código</span>
            <span class="stat-value">1</span>
          </div>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
          <div class="search-box">
            <input 
              type="text" 
              [ngModel]="searchTerm()" 
              (ngModelChange)="onSearchChange($event)"
              placeholder="🔍 Buscar código..."
            >
          </div>
          <div class="filter-buttons">
            <button 
              [class.active]="filterStatus() === 'all'"
              (click)="filterStatus.set('all'); currentPage.set(1)"
            >Todos</button>
            <button 
              [class.active]="filterStatus() === 'available'"
              (click)="filterStatus.set('available'); currentPage.set(1)"
            >Disponibles</button>
            <button 
              [class.active]="filterStatus() === 'used'"
              (click)="filterStatus.set('used'); currentPage.set(1)"
            >Usados</button>
          </div>
        </div>

        <div class="table-wrapper">
          <div class="loading-overlay" *ngIf="loading()">
            <div class="spinner"></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Código</th>
                <th>Puntos</th>
                <th>Estado</th>
                <th>Usado Por</th>
                <th>Fecha de Uso</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let code of codes()">
                <td>{{ code.id }}</td>
                <td class="font-bold code-display">{{ code.code }}</td>
                <td><span class="points-badge">{{ code.points }} pts</span></td>
                <td>
                  <span class="status-pill" [class.used]="Number(code.is_used) === 1" [class.available]="Number(code.is_used) === 0">
                    {{ Number(code.is_used) === 1 ? 'Usado' : 'Disponible' }}
                  </span>
                </td>
                <td>{{ code.user_name || '-' }}</td>
                <td>{{ code.used_at ? (code.used_at | date:'short') : '-' }}</td>
              </tr>
              <tr *ngIf="codes().length === 0 && !loading()">
                <td colspan="6" style="text-align: center; padding: 3rem;">No se encontraron resultados</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination-footer" *ngIf="totalRecords() > 0">
          <span class="page-info">
             MOSTRANDO {{ (currentPage() - 1) * pageSize + 1 }} - {{ Math.min(currentPage() * pageSize, totalRecords()) }} DE {{ totalRecords().toLocaleString() }}
          </span>
          <div class="pagination-controls">
            <button [disabled]="currentPage() === 1" (click)="setPage(currentPage() - 1)">«</button>
            <span class="page-number">{{ currentPage() }}</span>
            <button [disabled]="currentPage() >= totalPages()" (click)="setPage(currentPage() + 1)">»</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .admin-page { 
      padding: 2rem; 
      background: #0d0221d6; 
      min-height: 100vh; 
      color: white; 
      margin-left: 250px;
      transition: margin-left 0.3s ease;
    }
    .admin-page.sidebar-closed { margin-left: 0; }

    .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; gap: 2rem; flex-wrap: wrap; }
    .title { color: #F2E74B; font-size: 2rem; font-weight: 900; margin: 0; }
    .subtitle { color: rgba(255,255,255,0.6); margin: 0.5rem 0 0 0; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-card { background: rgba(108, 29, 218, 0.1); border: 1px solid rgba(108, 29, 218, 0.3); border-radius: 1rem; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; }
    .stat-icon { font-size: 2.5rem; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-label { color: rgba(255,255,255,0.6); font-size: 0.85rem; }
    .stat-value { color: #F2E74B; font-size: 1.5rem; font-weight: 900; }

    .table-container { background: rgba(255,255,255,0.02); border-radius: 1rem; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; position: relative; }
    .loading-overlay { 
      position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
      background: rgba(0,0,0,0.5); display: flex; align-items: center; 
      justify-content: center; z-index: 10; 
    }
    .spinner { width: 40px; height: 40px; border: 4px solid #F2E74B; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .table-header { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .search-box input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.75rem 1rem; border-radius: 0.5rem; width: 300px; outline: none; }
    .filter-buttons { display: flex; gap: 0.5rem; }
    .filter-buttons button { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; }
    .filter-buttons button.active { background: #6C1DDA; border-color: #6C1DDA; }

    .table-wrapper { overflow-x: auto; min-height: 400px; position: relative; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: rgba(108, 29, 218, 0.2); }
    th { padding: 1rem; text-align: left; font-weight: bold; color: #F2E74B; font-size: 0.85rem; text-transform: uppercase; }
    td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    tbody tr:hover { background: rgba(108, 29, 218, 0.1); }
    .font-bold { font-weight: 800; color: #F2E74B; }
    .code-display { font-family: 'Courier New', monospace; letter-spacing: 1px; }
    .points-badge { background: rgba(0, 204, 102, 0.2); color: #00cc66; padding: 0.3rem 0.6rem; border-radius: 0.3rem; font-weight: bold; font-size: 0.85rem; }
    .status-pill { padding: 0.3rem 0.8rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: bold; }
    .status-pill.available { background: #00cc66; color: white; }
    .status-pill.used { background: #666; color: white; }

    .pagination-footer { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(108, 29, 218, 0.2); }
    .page-info { font-weight: 900; color: #F2E74B; font-size: 0.85rem; text-transform: uppercase; }
    .pagination-controls { display: flex; align-items: center; gap: 0.75rem; }
    .pagination-controls button { 
      width: 35px; height: 35px; border-radius: 50%; background: #3A1A5E; border: none; color: #F2E74B; 
      display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.1rem; transition: 0.3s; 
    }
    .pagination-controls button:not(:disabled):hover { background: #6C1DDA; color: white; transform: scale(1.1); }
    .pagination-controls button:disabled { opacity: 0.3; cursor: not-allowed; }
    .page-number { font-weight: 900; color: #F2E74B; font-size: 1.1rem; margin: 0 0.5rem; }

    @media (max-width: 768px) {
      .hide-mobile { display: none; }
      .search-box input { width: 100%; }
      .stats-grid { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class AdminPromoCodesComponent implements OnInit {
  codes = signal<any[]>([]);
  searchTerm = signal('');
  filterStatus = signal<'all' | 'available' | 'used'>('all');
  currentPage = signal(1);
  pageSize = 50;
  totalRecords = signal(0);
  totalAvailable = signal(0);
  totalUsed = signal(0);
  loading = signal(false);

  Math = Math;
  Number = Number;

  constructor() {
    effect(() => {
      this.loadCodes();
    }, { allowSignalWrites: true });
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onSearchChange(val: string) {
    this.searchTerm.set(val);
    this.currentPage.set(1);
  }

  private http = inject(HttpClient);
  public layoutService = inject(AdminLayoutService);

  ngOnInit() { }

  loadCodes() {
    this.loading.set(true);
    const params: any = {
      page: this.currentPage(),
      limit: this.pageSize,
      status: this.filterStatus()
    };
    if (this.searchTerm()) {
      params.search = this.searchTerm();
    }

    this.http.get(`${environment.apiUrl}/admin/promo-codes`, { params }).subscribe({
      next: (res: any) => {
        this.codes.set(res.data || []);
        this.totalRecords.set(res.total || 0);
        this.totalAvailable.set(res.total_available || 0);
        this.totalUsed.set(res.total_used || 0);
        this.loading.set(false);
      },
      error: () => {
        this.codes.set([]);
        this.loading.set(false);
      }
    });
  }

  totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize));

  getLastDigits(code: string): string {
    if (!code) return '';
    return code.slice(-3);
  }
}
