import { Component, inject, OnInit, signal, computed } from '@angular/core';
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
            <span class="stat-value">{{ codes().length }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <span class="stat-label">Disponibles</span>
            <span class="stat-value">{{ availableCodes() }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-info">
            <span class="stat-label">Usados</span>
            <span class="stat-value">{{ usedCodes() }}</span>
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
              (ngModelChange)="searchTerm.set($event)"
              placeholder="🔍 Buscar código..."
            >
          </div>
          <div class="filter-buttons">
            <button 
              [class.active]="filterStatus() === 'all'"
              (click)="filterStatus.set('all')"
            >Todos</button>
            <button 
              [class.active]="filterStatus() === 'available'"
              (click)="filterStatus.set('available')"
            >Disponibles</button>
            <button 
              [class.active]="filterStatus() === 'used'"
              (click)="filterStatus.set('used')"
            >Usados</button>
          </div>
        </div>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Código</th>
                <th>Puntos</th>
                <th>Estado</th>
                <th>Usado Por</th>
                <th>Fecha de Uso</th>
                <th class="hide-mobile">Creado</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let code of paginatedCodes()">
                <td>{{ code.id }}</td>
                <td class="font-bold">{{ code.code }}</td>
                <td><span class="points-badge">{{ code.points }} pts</span></td>
                <td>
                  <span class="status-pill" [class.used]="code.is_used" [class.available]="!code.is_used">
                    {{ code.is_used ? 'Usado' : 'Disponible' }}
                  </span>
                </td>
                <td>{{ code.user_name || '-' }}</td>
                <td>{{ code.used_at ? (code.used_at | date:'short') : '-' }}</td>
                <td class="hide-mobile">{{ code.created_at | date:'short' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <div class="page-info">
            Mostrando {{ (currentPage - 1) * pageSize + 1 }} - 
            {{ Math.min(currentPage * pageSize, filteredCodes().length) }} 
            de {{ filteredCodes().length }}
          </div>
          <div class="page-controls">
            <button [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1">Anterior</button>
            <span>Página {{ currentPage }} de {{ totalPages() }}</span>
            <button [disabled]="currentPage >= totalPages()" (click)="currentPage = currentPage + 1">Siguiente</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .admin-page { 
      padding: 2rem; 
      background: #0D0221; 
      min-height: 100vh; 
      color: white; 
      margin-left: 250px;
      transition: margin-left 0.3s ease;
    }
    .admin-page.sidebar-closed { margin-left: 0; }

    .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; gap: 2rem; flex-wrap: wrap; }
    .title { color: #F2E74B; font-size: 2rem; font-weight: 900; margin: 0; }
    .subtitle { color: rgba(255,255,255,0.6); margin: 0.5rem 0 0 0; }
    .header-actions { display: flex; gap: 1rem; flex-wrap: wrap; }

    .export-btn { background: #F2E74B; border: none; color: #1A0B2E; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: 0.3s; }
    .export-btn:hover { background: #6C1DDA; color: white; transform: translateY(-2px); }
    .export-btn.secondary { background: rgba(108, 29, 218, 0.2); border: 1px solid #6C1DDA; color: #F2E74B; }
    .export-btn.secondary:hover { background: #6C1DDA; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-card { background: rgba(108, 29, 218, 0.1); border: 1px solid rgba(108, 29, 218, 0.3); border-radius: 1rem; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; }
    .stat-icon { font-size: 2.5rem; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-label { color: rgba(255,255,255,0.6); font-size: 0.85rem; }
    .stat-value { color: #F2E74B; font-size: 2rem; font-weight: 900; }

    .table-container { background: rgba(255,255,255,0.02); border-radius: 1rem; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; }
    .table-header { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .search-box input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.75rem 1rem; border-radius: 0.5rem; width: 300px; outline: none; }
    .filter-buttons { display: flex; gap: 0.5rem; }
    .filter-buttons button { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; }
    .filter-buttons button.active { background: #6C1DDA; border-color: #6C1DDA; }

    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: rgba(108, 29, 218, 0.2); }
    th { padding: 1rem; text-align: left; font-weight: bold; color: #F2E74B; font-size: 0.85rem; text-transform: uppercase; }
    td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    tbody tr:hover { background: rgba(108, 29, 218, 0.1); }
    .font-bold { font-weight: 800; color: #F2E74B; }
    .points-badge { background: rgba(0, 204, 102, 0.2); color: #00cc66; padding: 0.3rem 0.6rem; border-radius: 0.3rem; font-weight: bold; font-size: 0.85rem; }
    .status-pill { padding: 0.3rem 0.8rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: bold; }
    .status-pill.available { background: #00cc66; color: white; }
    .status-pill.used { background: #666; color: white; }

    .pagination { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
    .page-controls { display: flex; align-items: center; gap: 1rem; }
    .page-controls button { background: rgba(108, 29, 218, 0.2); border: 1px solid #6C1DDA; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; }
    .page-controls button:disabled { opacity: 0.3; cursor: not-allowed; }

    @media (max-width: 768px) {
      .hide-mobile { display: none; }
      .search-box input { width: 100%; }
    }
  `]
})
export class AdminPromoCodesComponent implements OnInit {
  codes = signal<any[]>([]);
  searchTerm = signal('');
  filterStatus = signal<'all' | 'available' | 'used'>('all');
  currentPage = 1;
  pageSize = 20;
  Math = Math;

  private http = inject(HttpClient);
  public layoutService = inject(AdminLayoutService);

  ngOnInit() {
    this.loadCodes();
  }

  loadCodes() {
    this.http.get(`${environment.apiUrl}/admin/promo-codes`).subscribe({
      next: (res: any) => {
        this.codes.set(Array.isArray(res) ? res : []);
      },
      error: () => {
        this.codes.set([]);
      }
    });
  }

  filteredCodes = computed(() => {
    let filtered = this.codes();

    // Filter by status
    if (this.filterStatus() === 'available') {
      filtered = filtered.filter(c => !c.is_used);
    } else if (this.filterStatus() === 'used') {
      filtered = filtered.filter(c => c.is_used);
    }

    // Filter by search
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(c =>
        c.code.toLowerCase().includes(search) ||
        (c.user_name && c.user_name.toLowerCase().includes(search))
      );
    }

    return filtered;
  });

  paginatedCodes = computed(() => {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCodes().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredCodes().length / this.pageSize));
  availableCodes = computed(() => this.codes().filter(c => !c.is_used).length);
  usedCodes = computed(() => this.codes().filter(c => c.is_used).length);
}
