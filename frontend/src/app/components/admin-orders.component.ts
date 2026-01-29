import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AdminNavbarComponent } from './admin-navbar.component';
import { AdminLayoutService } from '../services/admin-layout.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbarComponent],
  template: `
    <app-admin-navbar></app-admin-navbar>
    <div class="admin-page" [class.sidebar-closed]="!layoutService.isSidebarOpen()">
      <div class="header-row">
        <div>
           <h2 class="title">GESTIÓN DE PEDIDOS</h2>
           <p class="subtitle">Monitorea y actualiza el estado de las entregas</p>
        </div>
        <button class="export-btn" (click)="exportToCSV()">
           <span class="icon">📥</span> <span class="btn-text">Exportar CSV</span>
        </button>
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
                <th class="hide-mobile">Estado</th>
                <th class="text-right">Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of paginatedOrders()" (click)="selectOrder(order)" class="clickable-row">
                <td class="font-bold">{{ order.user_name }}</td>
                <td>{{ order.reward_title }}</td>
                <td class="hide-mobile">
                  <span class="status-pill" [class]="order.status">{{ order.status }}</span>
                </td>
                <td class="text-right text-sm text-gray">{{ order.created_at | date:'short' }}</td>
              </tr>
              <tr *ngIf="filteredOrders().length === 0">
                 <td colspan="4" class="text-center py-8 text-gray">No se encontraron pedidos</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" *ngIf="filteredOrders().length > 0">
          <div class="page-info">
             {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredOrders().length) }} de {{ filteredOrders().length }}
          </div>
          <div class="page-controls">
            <button [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1">«</button>
            <span class="current-page">{{ currentPage }}</span>
            <button [disabled]="currentPage >= totalPages()" (click)="currentPage = currentPage + 1">»</button>
          </div>
        </div>
      </div>

      <!-- Order Detail Modal -->
      <div class="modal-overlay" *ngIf="selectedOrder()" (click)="closeOrderModal($event)">
        <div class="order-modal" (click)="$event.stopPropagation()">
           <div class="modal-header">
             <h3>Detalle de Pedido #{{ selectedOrder().id }}</h3>
             <button class="close-btn" (click)="closeOrderModal($event)">✕</button>
           </div>
           
           <div class="modal-body" *ngIf="selectedOrder()">
              <div class="info-grid">
                <div class="info-item">
                  <label>Usuario</label>
                  <span>{{ selectedOrder().user_name }}</span>
                </div>
                <div class="info-item">
                  <label>Email</label>
                  <span>{{ selectedOrder().user_email }}</span>
                </div>
              </div>

              <div class="info-item full mt-4">
                <label>Recompensa</label>
                <span class="reward-text">{{ selectedOrder().reward_title }}</span>
              </div>

              <div class="info-grid mt-4">
                <div class="info-item">
                  <label>Puntos</label>
                  <span class="points-text">{{ selectedOrder().points_cost }} pts</span>
                </div>
                <div class="info-item">
                  <label>Fecha</label>
                  <span>{{ selectedOrder().created_at | date:'medium' }}</span>
                </div>
              </div>

              <hr class="divider">

              <div class="form-group mt-4">
                <label>Estado del Pedido</label>
                <select [(ngModel)]="selectedOrder().status" class="status-select">
                  <option value="pending">Pendiente</option>
                  <option value="processing">En Proceso</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregado</option>
                </select>
              </div>

              <div class="form-group mt-4">
                <label>Comentarios / Notas</label>
                <textarea 
                  [(ngModel)]="selectedOrder().admin_notes" 
                  placeholder="Agrega notas sobre el pedido, número de guía, etc..."
                  rows="4"
                  class="notes-textarea"
                ></textarea>
              </div>
           </div>

           <div class="modal-footer">
             <button class="btn-cancel" (click)="closeOrderModal($event)">Cerrar</button>
             <button class="btn-save" (click)="updateOrderStatus()">
                <span class="icon">💾</span> {{ savingOrder() ? 'Guardando...' : 'Guardar Cambios' }}
             </button>
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
    .admin-table tr:hover { background: rgba(242, 231, 75, 0.05); }

    .status-pill { padding: 0.3rem 0.8rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
    .status-pill.delivered { background: #00cc66; color: white; }
    .status-pill.pending { background: #ffaa00; color: #1A0B2E; }
    .status-pill.processing { background: #6C1DDA; color: white; }
    .status-pill.shipped { background: #00aaff; color: white; }
    .clickable-row { cursor: pointer; transition: 0.2s; }
    .clickable-row:hover { background: rgba(242, 231, 75, 0.1) !important; }

    /* Order Modal */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .order-modal { background: #1A0B2E; border: 2px solid #6C1DDA; border-radius: 1.5rem; padding: 2.5rem; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .modal-header h3 { margin: 0; color: #F2E74B; }
    .close-btn { background: transparent; border: none; color: white; font-size: 1.5rem; cursor: pointer; transition: 0.2s; }
    .close-btn:hover { color: #F2E74B; transform: rotate(90deg); }
    
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.3rem; }
    .info-item label { display: block; color: #F2E74B; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
    .info-item span { color: white; font-size: 1rem; }
    .info-item.full { grid-column: span 2; }
    .reward-text { font-weight: bold; font-size: 1.1rem !important; color: #F2E74B; }
    .points-text { font-weight: bold; color: #00cc66; }
    
    .divider { border: 0; border-top: 1px solid rgba(108, 29, 218, 0.2); margin: 2rem 0; }
    
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group label { display: block; color: #F2E74B; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
    .status-select, .notes-textarea { 
      width: 100%; background: rgba(0,0,0,0.2); border: 1px solid #6C1DDA; color: white; 
      padding: 1rem; border-radius: 0.6rem; outline: none; font-size: 0.95rem; font-family: inherit;
    }
    .notes-textarea { resize: vertical; min-height: 100px; }

    .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2.5rem; }
    .btn-cancel { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #ccc; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold; }
    .btn-save { background: #F2E74B; border: none; color: #1A0B2E; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 0.5rem; transition: 0.3s; }
    .btn-save:hover { background: #6C1DDA; color: white; }

    .mt-4 { margin-top: 1rem; }

    .pagination { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
    .page-controls { display: flex; align-items: center; gap: 1rem; }
    .page-controls button { background: #6C1DDA; border: none; color: white; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; }
    .page-controls button:disabled { opacity: 0.3; cursor: not-allowed; }
    .current-page { font-weight: 900; color: #F2E74B; }

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
export class AdminOrdersComponent implements OnInit {
  orders = signal<any[]>([]);
  selectedOrder = signal<any>(null);
  searchTerm = signal('');
  currentPage = 1;
  pageSize = 10;
  savingOrder = signal(false);
  Math = Math;

  private http = inject(HttpClient);
  public layoutService = inject(AdminLayoutService);

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    const mockData = [
      { id: 1, user_name: 'Juan Pérez', user_email: 'juan.perez@gmail.com', reward_title: 'Audífonos Bluetooth Pro', points_cost: 5000, status: 'delivered', admin_notes: '', created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: 2, user_name: 'María García', user_email: 'maria.garcia@outlook.com', reward_title: 'Mochila Takis Edición Especial', points_cost: 3500, status: 'shipped', admin_notes: 'Guía: 123456789', created_at: new Date(Date.now() - 172800000).toISOString() },
      { id: 3, user_name: 'Roberto Sánchez', user_email: 'roberto.s@prodigy.net', reward_title: 'Sudadera Takis Limited', points_cost: 7500, status: 'processing', admin_notes: '', created_at: new Date(Date.now() - 259200000).toISOString() },
      { id: 4, user_name: 'Ana Martínez', user_email: 'ana.mtz@yahoo.com', reward_title: 'Gorra Takis Flare', points_cost: 2000, status: 'pending', admin_notes: '', created_at: new Date(Date.now() - 345600000).toISOString() },
      { id: 5, user_name: 'Carlos López', user_email: 'clopez@gmail.com', reward_title: 'Tarjeta Amazon $500', points_cost: 10000, status: 'delivered', admin_notes: 'Código enviado por email', created_at: new Date(Date.now() - 432000000).toISOString() }
    ];

    this.http.get(`${environment.apiUrl}/admin/orders`).subscribe({
      next: (res: any) => {
        if (Array.isArray(res) && res.length > 0) {
          this.orders.set(res);
        } else {
          this.orders.set(mockData);
        }
      },
      error: (e: any) => {
        console.error('API orders error, using mock data:', e);
        this.orders.set(mockData);
      }
    });
  }

  filteredOrders = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.orders().filter((o: any) =>
      o.user_name?.toLowerCase().includes(term) ||
      o.reward_title?.toLowerCase().includes(term) ||
      o.status?.toLowerCase().includes(term)
    );
  });

  paginatedOrders = computed(() => {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredOrders().length / this.pageSize));

  selectOrder(order: any) {
    this.selectedOrder.set({ ...order });
  }

  closeOrderModal(event: Event) {
    event.stopPropagation();
    this.selectedOrder.set(null);
  }

  updateOrderStatus() {
    this.savingOrder.set(true);
    const updated = this.selectedOrder();

    // Simulate API update
    setTimeout(() => {
      this.orders.update(list => list.map(o => o.id === updated.id ? updated : o));
      this.savingOrder.set(false);
      this.selectedOrder.set(null);
    }, 1000);
  }

  exportToCSV() {
    const headers = ['ID', 'Usuario', 'Email', 'Recompensa', 'Puntos', 'Estado', 'Fecha'];
    const rows = this.filteredOrders().map((o: any) => [
      o.id,
      `"${o.user_name}"`,
      o.user_email,
      `"${o.reward_title}"`,
      o.points_cost,
      o.status,
      o.created_at
    ]);

    const csvContent = "\ufeff" + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "pedidos_takis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
