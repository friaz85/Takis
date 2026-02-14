import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
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
           <h2 class="title">CÓDIGOS REGISTRADOS</h2>
           <p class="subtitle">Seguimiento de códigos Takis registrados por los usuarios</p>
        </div>
        <div class="header-actions">
          <button class="export-btn" (click)="loadCodes()">
            <span class="icon">🔄</span> <span class="btn-text">Refrescar</span>
          </button>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
           <div class="search-box">
             <input 
               type="text" 
               [ngModel]="searchTerm()" 
               (ngModelChange)="onSearchChange($event)"
               placeholder="Buscar por código, usuario o email..."
             >
           </div>
        </div>

        <div class="table-wrapper">
          <div class="loading-overlay" *ngIf="loading()">
            <div class="spinner"></div>
          </div>
          <table class="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Código</th>
                <th>Puntos</th>
                <th class="hide-mobile">IP Registro</th>
                <th class="text-right">Fecha Registro</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let entry of codes()">
                <td class="font-bold">
                   {{ entry.user_name || 'Usuario' }}
                   <small class="block text-gray hide-mobile">{{ entry.user_email }}</small>
                </td>
                <td class="code-cell">{{ entry.code }}</td>
                <td class="text-gold font-bold">{{ entry.points }} pts</td>
                <td class="hide-mobile text-sm">{{ entry.ip_address || '-' }}</td>
                <td class="text-right text-sm text-gray">{{ entry.used_at | date:'short' }}</td>
              </tr>
              <tr *ngIf="codes().length === 0 && !loading()">
                 <td colspan="5" class="text-center py-8 text-gray">No se encontraron códigos registrados</td>
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
      padding: 5rem 2rem 2rem 2rem; 
      margin-left: 260px;
      min-height: 100vh;
      background: #0d0221d6;
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
    .export-btn:hover { background: #F2E74B; color: #1A0B2E; transform: translateY(-2px); }

    .table-container { background: rgba(255,255,255,0.05); border: 2px solid #6C1DDA; border-radius: 1.5rem; overflow: hidden; position: relative; }
    .table-header { padding: 1.5rem; border-bottom: 1px solid rgba(108, 29, 218, 0.2); }
    .search-box input {
      width: 100%; max-width: 400px; background: rgba(0,0,0,0.2); border: 1px solid #6C1DDA;
      color: white; padding: 0.8rem 1.2rem; border-radius: 0.5rem; outline: none;
    }

    .loading-overlay { 
      position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
      background: rgba(0,0,0,0.5); display: flex; align-items: center; 
      justify-content: center; z-index: 10; 
    }
    .spinner { width: 40px; height: 40px; border: 4px solid #F2E74B; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .table-wrapper { overflow-x: auto; min-height: 300px; }
    .admin-table { width: 100%; border-collapse: collapse; }
    .admin-table th { background: rgba(108, 29, 218, 0.2); color: #F2E74B; padding: 1.2rem; text-align: left; font-size: 0.85rem; text-transform: uppercase; font-weight: 900; }
    .admin-table td { padding: 1.2rem; border-bottom: 1px solid rgba(108, 29, 218, 0.1); font-size: 0.9rem; }
    
    .code-cell { color: #F2E74B; font-weight: bold; font-family: monospace; letter-spacing: 1px; }
    
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

    .text-gold { color: #F2E74B; }
    .text-gray { color: #888; }
    .block { display: block; }

    @media (max-width: 1100px) {
      .admin-page { margin-left: 0; padding: 5rem 1rem 2rem 1rem; }
      .header-row { flex-direction: column; align-items: flex-start; }
      .search-box input { max-width: 100%; }
      .hide-mobile { display: none; }
    }
  `]
})
export class AdminEntryCodesComponent implements OnInit {
  codes = signal<any[]>([]);
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 50;
  totalRecords = signal(0);
  loading = signal(false);

  Math = Math;

  private http = inject(HttpClient);
  public layoutService = inject(AdminLayoutService);

  constructor() {
    effect(() => {
      this.loadCodes();
    }, { allowSignalWrites: true });
  }

  ngOnInit() { }

  loadCodes() {
    this.loading.set(true);
    const params: any = {
      page: this.currentPage(),
      limit: this.pageSize
    };
    if (this.searchTerm()) {
      params.search = this.searchTerm();
    }

    this.http.get(`${environment.apiUrl}/admin/entry-codes`, { params }).subscribe({
      next: (res: any) => {
        this.codes.set(res.data || []);
        this.totalRecords.set(res.total || 0);
        this.loading.set(false);
      },
      error: () => {
        this.codes.set([]);
        this.loading.set(false);
      }
    });
  }

  onSearchChange(val: string) {
    this.searchTerm.set(val);
    this.currentPage.set(1);
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize));
}
