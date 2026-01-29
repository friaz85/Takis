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
           <h2 class="title">CÓDIGOS CANJEADOS</h2>
           <p class="subtitle">Seguimiento de códigos ingresados por los usuarios</p>
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
               placeholder="Buscar por código o usuario..."
             >
           </div>
        </div>

        <div class="table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Usuario</th>
                <th class="hide-mobile">Puntos</th>
                <th class="text-right">Fecha Canje</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let entry of paginatedCodes()">
                <td class="code-cell">{{ entry.code }}</td>
                <td class="font-bold">
                   {{ entry.user_name }}
                   <small class="block text-gray hide-mobile">{{ entry.user_email }}</small>
                </td>
                <td class="hide-mobile text-gold font-bold">{{ entry.points_awarded }} pts</td>
                <td class="text-right text-sm text-gray">{{ entry.created_at | date:'short' }}</td>
              </tr>
              <tr *ngIf="filteredCodes().length === 0">
                 <td colspan="4" class="text-center py-8 text-gray">No se encontraron códigos</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" *ngIf="filteredCodes().length > 0">
          <div class="page-info">
             {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredCodes().length) }} de {{ filteredCodes().length }}
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
    
    .code-cell { font-family: 'Courier New', monospace; color: #F2E74B; font-weight: bold; letter-spacing: 1px; }

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
  codes = signal<any[]>([]);
  searchTerm = signal('');
  currentPage = 1;
  pageSize = 10;
  Math = Math;

  private http = inject(HttpClient);
  public layoutService = inject(AdminLayoutService);

  ngOnInit() {
    this.loadCodes();
  }

  loadCodes() {
    const mockData = [
      { id: 1, code: 'TAKI-1234-ABCD', user_name: 'Carlos Ruiz', user_email: 'carlos@example.com', points_awarded: 100, created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: 2, code: 'REDM-9988-XYZZ', user_name: 'Elena Gómez', user_email: 'elena@gmail.com', points_awarded: 250, created_at: new Date(Date.now() - 7200000).toISOString() },
      { id: 3, code: 'PROM-0011-BBAA', user_name: 'Marcos Soto', user_email: 'msoto@outlook.com', points_awarded: 50, created_at: new Date(Date.now() - 10800000).toISOString() },
      { id: 4, code: 'WINN-5566-FFEE', user_name: 'Lucía Méndez', user_email: 'lucia.m@prodigy.net', points_awarded: 500, created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: 5, code: 'TAKI-7777-GLOW', user_name: 'Ricardo Paz', user_email: 'rpaz@gmail.com', points_awarded: 150, created_at: new Date(Date.now() - 172800000).toISOString() },
      { id: 6, code: 'XP-LEVEL-UP-23', user_name: 'Juan Pérez', user_email: 'juan@test.com', points_awarded: 1000, created_at: new Date(Date.now() - 259200000).toISOString() },
      { id: 7, code: 'TAKI-FLAM-HOT9', user_name: 'Sofia Lara', user_email: 'slara@mx.com', points_awarded: 200, created_at: new Date(Date.now() - 345600000).toISOString() },
      { id: 8, code: 'CODE-99-PROMO', user_name: 'Pedro Solís', user_email: 'psolis@demo.es', points_awarded: 75, created_at: new Date(Date.now() - 432000000).toISOString() },
      { id: 9, code: 'TAKI-2026-ROCK', user_name: 'Diana Luz', user_email: 'dluz@mail.com', points_awarded: 300, created_at: new Date(Date.now() - 518400000).toISOString() },
      { id: 10, code: 'REWARD-ME-NOW', user_name: 'Marta Gil', user_email: 'marta.gil@web.com', points_awarded: 150, created_at: new Date(Date.now() - 604800000).toISOString() }
    ];

    this.http.get(`${environment.apiUrl}/admin/entry/codes`).subscribe({
      next: (res: any) => {
        if (Array.isArray(res) && res.length > 0) {
          this.codes.set(res);
        } else {
          this.codes.set(mockData);
        }
      },
      error: (e: any) => {
        console.error('API codes error, using mock data:', e);
        this.codes.set(mockData);
      }
    });
  }

  filteredCodes = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.codes().filter((c: any) =>
      c.code?.toLowerCase().includes(term) ||
      c.user_name?.toLowerCase().includes(term)
    );
  });

  paginatedCodes = computed(() => {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCodes().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredCodes().length / this.pageSize));

  exportToCSV() {
    const headers = ['ID', 'Código', 'Puntos', 'Usuario', 'Email', 'IP', 'Fecha'];
    const rows = this.filteredCodes().map((c: any) => [
      c.id,
      c.code,
      c.points,
      `"${c.user_name}"`,
      c.user_email,
      c.ip_address || 'N/A',
      new Date(c.redeemed_at).toLocaleString('es-MX')
    ]);

    const csvContent = "\ufeff" + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "codigos_canjeados_takis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
