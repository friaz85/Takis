import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../services/toast.service';
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

      <!-- Order Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-info">
            <span class="stat-label">Total Pedidos</span>
            <span class="stat-value">{{ orders().length }}</span>
          </div>
        </div>
        <div class="stat-card pending">
          <div class="stat-icon">⏳</div>
          <div class="stat-info">
            <span class="stat-label">Pendientes</span>
            <span class="stat-value">{{ pendingStats() }}</span>
          </div>
        </div>
        <div class="stat-card processing">
          <div class="stat-icon">⚙️</div>
          <div class="stat-info">
            <span class="stat-label">En Proceso</span>
            <span class="stat-value">{{ processingStats() }}</span>
          </div>
        </div>
        <div class="stat-card shipped">
          <div class="stat-icon">🚚</div>
          <div class="stat-info">
            <span class="stat-label">Enviados</span>
            <span class="stat-value">{{ shippedStats() }}</span>
          </div>
        </div>
        <div class="stat-card delivered">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <span class="stat-label">Entregados</span>
            <span class="stat-value">{{ deliveredStats() }}</span>
          </div>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
           <div class="search-box">
             <input 
               type="text" 
               [ngModel]="searchTerm()" 
               (ngModelChange)="searchTerm.set($event); currentPage.set(1)"
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
                  <span class="status-pill" [class]="order.status">{{ getStatusLabel(order.status) }}</span>
                </td>
                <td class="text-right text-sm text-gray">{{ order.created_at | date:'short' }}</td>
              </tr>
              <tr *ngIf="filteredOrders().length === 0">
                 <td colspan="4" class="text-center py-8 text-gray">No se encontraron pedidos</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination-footer" *ngIf="filteredOrders().length > 0">
          <span class="page-info">
             {{ (currentPage() - 1) * pageSize + 1 }} - {{ Math.min(currentPage() * pageSize, filteredOrders().length) }} DE {{ filteredOrders().length }}
          </span>
          <div class="pagination-controls">
            <button [disabled]="currentPage() === 1" (click)="setPage(currentPage() - 1)">«</button>
            <span class="page-number">{{ currentPage() }}</span>
            <button [disabled]="currentPage() >= totalPages()" (click)="setPage(currentPage() + 1)">»</button>
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

              <div class="info-grid mt-4">
                <div class="info-item">
                  <label>Recompensa</label>
                  <span class="reward-text">{{ selectedOrder().reward_title }}</span>
                </div>
                <div class="info-item">
                  <label>Fecha del Pedido</label>
                  <span>{{ selectedOrder().created_at | date:'medium' }}</span>
                </div>
              </div>

              <!-- Address Accordion -->
              <div class="address-accordion mt-4">
                <button class="accordion-toggle" (click)="showAddress.set(!showAddress())">
                   <span>📍 Datos de Envío</span>
                   <span class="arrow" [class.open]="showAddress()">▼</span>
                </button>
                <div class="accordion-content" *ngIf="showAddress()">
                  <div class="address-details">
                    <p><strong>Recibe:</strong> {{ selectedOrder().recipient_name || selectedOrder().user_name }}</p>
                    <p><strong>Dirección:</strong> {{ selectedOrder().address }}</p>
                    <p><strong>CP / Colonia:</strong> {{ selectedOrder().zip_code }} - {{ selectedOrder().colonia }}</p>
                    <p><strong>Mpio / Estado:</strong> {{ selectedOrder().municipio }} / {{ selectedOrder().state }}</p>
                    <p><strong>Teléfono:</strong> {{ selectedOrder().phone }}</p>
                    <p *ngIf="selectedOrder().delivery_instructions"><strong>Notas:</strong> {{ selectedOrder().delivery_instructions }}</p>
                  </div>
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

              <!-- Tracking Information Section -->
              <div class="tracking-section mt-4" *ngIf="selectedOrder().status === 'shipped' || selectedOrder().status === 'delivered'">
                <h4 class="section-title">📦 Información de Envío</h4>
                
                <div class="form-group mt-3">
                  <label>Número de Guía</label>
                  <input 
                    type="text" 
                    [(ngModel)]="selectedOrder().tracking_number" 
                    placeholder="Ej: 1234567890"
                    class="tracking-input"
                  >
                </div>

                <div class="form-group mt-3">
                  <label>URL de Rastreo</label>
                  <input 
                    type="url" 
                    [(ngModel)]="selectedOrder().tracking_url" 
                    placeholder="https://rastreo.paqueteria.com/..."
                    class="tracking-input"
                  >
                </div>

                <div class="form-group mt-3">
                  <label>Fecha de Entrega Estimada</label>
                  <input 
                    type="date" 
                    [(ngModel)]="selectedOrder().delivery_date" 
                    class="tracking-input"
                  >
                </div>
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
    .export-btn .icon { color: #fff; }
    .export-btn:hover { background: #F2E74B; color: #1A0B2E; transform: translateY(-2px); }
    .export-btn:hover .icon { color: inherit; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-card { background: rgba(108, 29, 218, 0.1); border: 2px solid rgba(108, 29, 218, 0.3); border-radius: 1.5rem; padding: 1.5rem; display: flex; align-items: center; gap: 1.2rem; transition: 0.3s; }
    .stat-card:hover { transform: translateY(-5px); border-color: #6C1DDA; background: rgba(108, 29, 218, 0.2); }
    .stat-card.pending { border-color: rgba(255, 170, 0, 0.3); }
    .stat-card.pending:hover { border-color: #ffaa00; }
    .stat-card.processing { border-color: rgba(108, 29, 218, 0.3); }
    .stat-card.processing:hover { border-color: #6C1DDA; }
    .stat-card.delivered { border-color: rgba(0, 204, 102, 0.3); }
    .stat-card.delivered:hover { border-color: #00cc66; }
    .stat-card.shipped { border-color: rgba(0, 170, 255, 0.3); }
    .stat-card.shipped:hover { border-color: #00aaff; }

    .stat-icon { font-size: 2.5rem; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-label { color: rgba(255,255,255,0.6); font-size: 0.85rem; font-weight: bold; text-transform: uppercase; }
    .stat-value { color: #F2E74B; font-size: 2.2rem; font-weight: 900; }
    .stat-card.pending .stat-value { color: #ffaa00; }
    .stat-card.delivered .stat-value { color: #00cc66; }
    .stat-card.shipped .stat-value { color: #00aaff; }

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
    
    .tracking-section { 
      background: rgba(108, 29, 218, 0.1); 
      border: 1px solid rgba(108, 29, 218, 0.3); 
      border-radius: 0.8rem; 
      padding: 1.5rem; 
      margin-top: 1.5rem;
    }
    .section-title { 
      color: #F2E74B; 
      font-size: 1rem; 
      font-weight: bold; 
      margin: 0 0 1rem 0; 
      text-transform: uppercase;
    }
    .tracking-input { 
      width: 100%; 
      background: rgba(0,0,0,0.3); 
      border: 1px solid #6C1DDA; 
      color: white; 
      padding: 1rem; 
      border-radius: 0.6rem; 
      outline: none; 
      font-size: 0.95rem; 
      font-family: inherit;
    }
    .tracking-input:focus { 
      border-color: #F2E74B; 
      background: rgba(0,0,0,0.4);
    }
    .mt-3 { margin-top: 0.75rem; }

    .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2.5rem; }
    .btn-cancel { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #ccc; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold; }
    .btn-save { background: #F2E74B; border: none; color: #1A0B2E; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 0.5rem; transition: 0.3s; }
    .btn-save:hover { background: #6C1DDA; color: white; }

    /* Address Accordion */
    .address-accordion {
      border: 1px solid rgba(108, 29, 218, 0.3);
      border-radius: 0.8rem;
      overflow: hidden;
      background: rgba(108, 29, 218, 0.05);
    }
    .accordion-toggle {
      width: 100%;
      padding: 1rem;
      background: rgba(108, 29, 218, 0.1);
      border: none;
      color: #F2E74B;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: 0.3s;
    }
    .accordion-toggle:hover { background: rgba(108, 29, 218, 0.2); }
    .accordion-content {
      padding: 1.2rem;
      border-top: 1px solid rgba(108, 29, 218, 0.2);
    }
    .address-details p {
      margin: 0.5rem 0;
      font-size: 0.9rem;
      color: #e0e0e0;
    }
    .address-details strong {
      color: #F2E74B;
      font-size: 0.85rem;
      text-transform: uppercase;
      margin-right: 0.5rem;
    }
    .arrow { transition: 0.3s; font-size: 0.8rem; }
    .arrow.open { transform: rotate(180deg); }

    .mt-4 { margin-top: 1rem; }

    .pagination-footer { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(108, 29, 218, 0.2); }
    .page-info { font-weight: 900; color: white; font-size: 0.85rem; text-transform: uppercase; }
    .pagination-controls { display: flex; align-items: center; gap: 0.75rem; }
    .pagination-controls button { 
      width: 35px; height: 35px; border-radius: 50%; background: #3A1A5E; border: none; color: #F2E74B; 
      display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.1rem; transition: 0.3s; 
    }
    .pagination-controls button:not(:disabled):hover { background: #6C1DDA; color: white; transform: scale(1.1); }
    .pagination-controls button:disabled { opacity: 0.3; cursor: not-allowed; }
    .page-number { font-weight: 900; color: #F2E74B; font-size: 1.1rem; margin: 0 0.5rem; }

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
  currentPage = signal(1);
  pageSize = 10;
  savingOrder = signal(false);
  showAddress = signal(false);
  Math = Math;
  dataVersion = signal(0);

  getStatusLabel(status: string) {
    const labels: any = {
      'pending': 'PENDIENTE',
      'processing': 'EN PROCESO',
      'shipped': 'ENVIADO',
      'delivered': 'ENTREGADO'
    };
    return labels[status] || status.toUpperCase();
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  private http = inject(HttpClient);
  private toast = inject(ToastService);
  public layoutService = inject(AdminLayoutService);

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.http.get(`${environment.apiUrl}/admin/orders`).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.orders.set(res);
        } else {
          this.orders.set([]);
        }
      },
      error: (e: any) => {
        console.error('API orders error:', e);
        this.orders.set([]);
      }
    });
  }

  filteredOrders = computed(() => {
    this.dataVersion();
    const term = this.searchTerm().toLowerCase();
    return this.orders().filter((o: any) =>
      o.user_name?.toLowerCase().includes(term) ||
      o.reward_title?.toLowerCase().includes(term) ||
      this.getStatusLabel(o.status).toLowerCase().includes(term)
    );
  });

  paginatedOrders = computed(() => {
    const data = this.filteredOrders();
    const start = (this.currentPage() - 1) * this.pageSize;
    return data.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredOrders().length / this.pageSize));

  pendingStats = computed(() => this.orders().filter(o => o.status === 'pending').length);
  processingStats = computed(() => this.orders().filter(o => o.status === 'processing').length);
  shippedStats = computed(() => this.orders().filter(o => o.status === 'shipped').length);
  deliveredStats = computed(() => this.orders().filter(o => o.status === 'delivered').length);

  selectOrder(order: any) {
    this.selectedOrder.set({
      ...order,
      tracking_number: order.tracking_number || '',
      tracking_url: order.tracking_url || '',
      delivery_date: order.delivery_date || '',
      admin_notes: order.admin_notes || ''
    });
  }

  closeOrderModal(event: Event) {
    event.stopPropagation();
    this.selectedOrder.set(null);
    this.showAddress.set(false);
  }

  updateOrderStatus() {
    this.savingOrder.set(true);
    const updated = this.selectedOrder();

    // Send to backend
    this.http.post(`${environment.apiUrl}/admin/orders/${updated.id}/update`, {
      status: updated.status,
      admin_notes: updated.admin_notes,
      tracking_number: updated.tracking_number,
      tracking_url: updated.tracking_url,
      delivery_date: updated.delivery_date
    }).subscribe({
      next: () => {
        this.orders.update(list => list.map(o => o.id === updated.id ? updated : o));
        this.savingOrder.set(false);
        this.selectedOrder.set(null);
        this.toast.show('¡PEDIDO ACTUALIZADO EXITOSAMENTE!', 'success');
      },
      error: (err) => {
        console.error('Error al actualizar pedido:', err);
        this.toast.show('ERROR AL ACTUALIZAR PEDIDO.', 'error');
        this.savingOrder.set(false);
        this.selectedOrder.set(null);
      }
    });
  }

  exportToCSV() {
    const headers = ['ID', 'Usuario', 'Email', 'Recompensa', 'Puntos', 'Estado', 'Fecha', 'Destinatario', 'Teléfono', 'Dirección', 'Colonia', 'Ciudad/Mpio', 'Estado', 'CP', 'Notas Entrega'];
    const rows = this.filteredOrders().map((o: any) => [
      o.id,
      `"${o.user_name}"`,
      o.user_email,
      `"${o.reward_title}"`,
      o.points_cost,
      o.status,
      o.created_at,
      `"${o.recipient_name || ''}"`,
      o.phone || '',
      `"${o.address || ''}"`,
      `"${o.colonia || ''}"`,
      `"${o.city || o.municipio || ''}"`,
      `"${o.state || ''}"`,
      o.zip_code || '',
      `"${o.delivery_instructions || ''}"`
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
