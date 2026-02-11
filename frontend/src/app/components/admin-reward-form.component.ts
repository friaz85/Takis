import { Component, inject, OnInit, signal, computed, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AdminNavbarComponent } from './admin-navbar.component';
import { AdminLayoutService } from '../services/admin-layout.service';
import { ToastService } from '../services/toast.service';
import { environment } from '../../environments/environment';

interface CodeArea {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

@Component({
  selector: 'app-admin-rewards',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbarComponent],
  template: `
    <app-admin-navbar></app-admin-navbar>
    <div class="admin-page" [class.sidebar-closed]="!layoutService.isSidebarOpen()">
      <div class="header-row">
        <div>
           <h2 class="title">GESTIÓN DE RECOMPENSAS</h2>
           <p class="subtitle">Agrega y edita los premios disponibles</p>
        </div>
        <div class="header-actions">
           <button class="export-btn secondary" (click)="exportToCSV()">
             <span class="icon">📥</span> <span class="btn-text">Exportar CSV</span>
           </button>
            <button class="export-btn create-reward-btn" (click)="openCreateModal()">
              <span class="icon">➕</span> <span class="btn-text">Nueva Recompensa</span>
            </button>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
           <div class="search-box">
             <input 
               type="text" 
               [ngModel]="searchTerm()" 
               (ngModelChange)="searchTerm.set($event); currentPage.set(1)"
               placeholder="Buscar recompensa..."
             >
           </div>
        </div>

        <div class="table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th class="hide-mobile">Puntos</th>
                <th class="hide-mobile">Stock</th>
                <th class="hide-mobile">Tipo</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let reward of paginatedRewards()">
                <td>
                  <img [src]="reward.image_url ? environment.uploadsUrl + '/rewards/' + reward.image_url : 'assets/takis-piece.png'" class="reward-thumb" alt="Premio">
                </td>
                <td>
                  <span class="font-bold">{{ reward.title }}</span>
                  <small class="block text-gray hide-mobile">{{ reward.type === 'physical' ? 'FÍSICO' : 'DIGITAL' }}</small>
                </td>
                <td class="hide-mobile font-bold text-gold">{{ (reward.cost || 0) | number }} pts</td>
                <td class="hide-mobile">
                   <span class="stock-badge" [class.low]="reward.stock <= 5">{{ reward.stock }}</span>
                </td>
                <td class="hide-mobile">
                   <span class="type-badge" [class.digital]="reward.type === 'digital'">
                      {{ reward.type === 'physical' ? '📦 Físico' : '💾 Digital' }}
                   </span>
                </td>
                <td class="text-right">
                   <div class="action-group">
                     <button class="icon-btn edit" (click)="editReward(reward)" title="Editar">✏️</button>
                     <button class="icon-btn delete" (click)="deleteReward(reward.id)" title="Eliminar">🗑️</button>
                   </div>
                </td>
              </tr>
              <tr *ngIf="filteredRewards().length === 0">
                 <td colspan="6" class="text-center py-8 text-gray">No se encontraron recompensas</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination-footer" *ngIf="filteredRewards().length > 0">
          <span class="page-info">
             {{ (currentPage() - 1) * pageSize + 1 }} - {{ Math.min(currentPage() * pageSize, filteredRewards().length) }} DE {{ filteredRewards().length }}
          </span>
          <div class="pagination-controls">
            <button [disabled]="currentPage() === 1" (click)="setPage(currentPage() - 1)">«</button>
            <span class="page-number">{{ currentPage() }}</span>
            <button [disabled]="currentPage() >= totalPages()" (click)="setPage(currentPage() + 1)">»</button>
          </div>
        </div>
      </div>

      <!-- Advanced Create/Edit Modal -->
      <div class="modal-overlay" *ngIf="showCreateModal || editingReward" (click)="closeModal($event)">
        <div class="reward-editor-modal" (click)="$event.stopPropagation()">
           <div class="modal-header">
             <h3>{{ (editingReward && editingReward.id) ? 'Editar' : 'Nueva' }} Recompensa</h3>
             <button class="close-btn" (click)="closeModal($event)">✕</button>
           </div>
           
           <div class="editor-container" *ngIf="editingReward">
              <!-- LEFT PANEL: Form Fields -->
              <div class="editor-left">
                <div class="form-group">
                  <label>Título de la Recompensa</label>
                  <input type="text" [(ngModel)]="editingReward.title" placeholder="Ej: Audífonos Bluetooth Pro">
                </div>

                <div class="form-group">
                  <label>Imagen del Producto (800x800px recomendado)</label>
                  <input type="file" (change)="onImageSelected($event)" accept="image/*" class="file-input">
                  <small class="help-text">Formato cuadrado para mejor visualización</small>
                </div>

                <div class="form-group">
                  <label>Descripción</label>
                  <textarea [(ngModel)]="editingReward.description" placeholder="Describe la recompensa..." rows="3"></textarea>
                </div>

                <div class="form-group">
                  <label>Tipo de Recompensa</label>
                  <div class="type-selector">
                    <button 
                      class="type-btn" 
                      [class.active]="editingReward.type === 'physical'"
                      (click)="editingReward.type = 'physical'"
                    >
                      📦 Físico
                    </button>
                    <button 
                      class="type-btn" 
                      [class.active]="editingReward.type === 'digital'"
                      (click)="editingReward.type = 'digital'"
                    >
                      💾 Digital
                    </button>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Costo (Puntos)</label>
                    <input type="number" [(ngModel)]="editingReward.cost" placeholder="5000">
                  </div>
                  <div class="form-group">
                    <label>Stock Disponible</label>
                    <input type="number" [(ngModel)]="editingReward.stock" placeholder="100">
                  </div>
                </div>

                <!-- Digital PDF Section -->
                <div class="digital-section" *ngIf="editingReward.type === 'digital'">
                  <div class="section-header">
                    <h4>⚙️ Configuración Digital</h4>
                  </div>

                  <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label>Tipo de Archivo</label>
                    <div class="type-selector">
                      <button 
                        class="type-btn" 
                        [class.active]="digitalSubtype() === 'pdf'"
                        (click)="digitalSubtype.set('pdf'); isWallpaperMode.set(false)"
                      >
                        📄 Documento PDF
                      </button>
                      <button 
                        class="type-btn" 
                        [class.active]="digitalSubtype() === 'wallpaper'"
                        (click)="digitalSubtype.set('wallpaper'); isWallpaperMode.set(true)"
                      >
                        🖼️ Wallpaper
                      </button>
                    </div>
                  </div>
                  
                  <div class="form-group" *ngIf="digitalSubtype() === 'pdf'">
                    <label>Plantilla PDF (Cupones/Certificados)</label>
                    <input type="file" (change)="onPDFSelected($event)" accept=".pdf" class="file-input">
                    <small class="help-text" *ngIf="editingReward.pdf_template && !isWallpaperMode()">Actual: {{ editingReward.pdf_template }}</small>
                  </div>

                  <div class="form-group" *ngIf="digitalSubtype() === 'wallpaper'">
                    <label>Imagen Wallpaper (JPG/PNG)</label>
                    <input type="file" (change)="onWallpaperSelected($event)" accept=".jpg,.jpeg,.png" class="file-input">
                    <small class="help-text" *ngIf="editingReward.pdf_template && isWallpaperMode()">Actual: {{ editingReward.pdf_template }}</small>
                  </div>

                  <div class="code-areas-manager" *ngIf="digitalSubtype() === 'pdf' && pdfLoaded()">
                    <div class="areas-header">
                      <div>
                        <label>📍 Áreas de Código</label>
                        <small class="help-text">Define dónde se imprimirá el código en el certificado</small>
                      </div>
                      <button class="btn-add-area" (click)="addCodeArea()">
                        ➕ Agregar Área
                      </button>
                    </div>
                    <div class="areas-list">
                      <div class="area-item" *ngFor="let area of codeAreas(); let i = index">
                        <div class="area-info">
                          <span class="area-number">Área {{i + 1}}</span>
                          <span class="area-coords">📐 {{area.x}}, {{area.y}}</span>
                        </div>
                        <div class="area-controls">
                          <div class="font-control">
                            <label>Tamaño:</label>
                            <input type="number" [(ngModel)]="area.fontSize" min="8" max="72" placeholder="14">
                            <span class="unit">pt</span>
                          </div>
                          <button class="btn-remove" (click)="removeCodeArea(i)" title="Eliminar área">🗑️</button>
                        </div>
                      </div>
                      <div class="areas-empty" *ngIf="codeAreas().length === 0">
                        <p>👆 Haz clic en "Agregar Área" para definir dónde se imprimirá el código</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label>Estado</label>
                  <div class="type-selector">
                    <button 
                      class="type-btn small" 
                      [class.active]="editingReward.active === 1"
                      (click)="editingReward.active = 1"
                    >
                      ✅ Activo
                    </button>
                    <button 
                      class="type-btn small" 
                      [class.active]="editingReward.active === 0"
                      (click)="editingReward.active = 0"
                    >
                      ⛔ Inactivo
                    </button>
                  </div>
                </div>
              </div>

              <!-- RIGHT PANEL: Preview -->
              <div class="editor-right">
                <div class="preview-container">
                  <h4>Vista Previa</h4>
                  
                  <!-- Image Preview (ONLY for physical rewards) -->
                  <div class="image-preview" *ngIf="editingReward.type === 'physical' && (selectedImagePreview || editingReward.image_url)">
                    <img [src]="selectedImagePreview || environment.uploadsUrl + '/rewards/' + editingReward.image_url" alt="Preview">
                  </div>

                  <!-- PDF Preview with Draggable Areas (ONLY for digital rewards of type PDF) -->
                  <div class="pdf-preview-wrapper" *ngIf="editingReward.type === 'digital' && digitalSubtype() === 'pdf'">
                    <div class="pdf-canvas-container" #pdfContainer>
                      <canvas #pdfCanvas [style.display]="pdfLoaded() ? 'block' : 'none'"></canvas>
                      
                      <!-- Loading indicator -->
                      <div class="pdf-loading" *ngIf="!pdfLoaded() && (selectedPDF || editingReward.pdf_template)">
                        <p>⏳ Cargando PDF...</p>
                      </div>
                      
                      <!-- Draggable/Resizable Code Areas -->
                      <div 
                        *ngFor="let area of codeAreas(); let i = index"
                        class="code-area-box"
                        [style.left.px]="area.x"
                        [style.top.px]="area.y"
                        [style.width.px]="area.width"
                        [style.height.px]="area.height"
                        [style.display]="pdfLoaded() ? 'block' : 'none'"
                        (mousedown)="startDrag($event, i)"
                      >
                        <div class="area-label">Área {{i + 1}} ({{area.fontSize}}pt)</div>
                        <div class="demo-text" [style.font-size.pt]="area.fontSize">Código demo {{i + 1}}</div>
                        <div class="resize-handle" (mousedown)="startResize($event, i)"></div>
                      </div>
                    </div>
                  </div>

                  <div class="preview-placeholder" *ngIf="(editingReward.type === 'physical' && !selectedImagePreview && !editingReward.image_url) || (editingReward.type === 'digital' && digitalSubtype() === 'pdf' && !selectedPDF && !editingReward.pdf_template)">
                    <p>{{ editingReward.type === 'digital' ? '📄 Sube un PDF para ver la vista previa' : '📸 Sube una imagen para ver la vista previa' }}</p>
                  </div>

                  <div class="preview-placeholder" *ngIf="editingReward.type === 'digital' && digitalSubtype() === 'wallpaper'">
                    <p>🖼️ Vista previa no disponible para Wallpapers.<br><small>El archivo se cargará directamente.</small></p>
                  </div>
                </div>
              </div>
           </div>

           <div class="modal-footer">
             <button class="btn-cancel" (click)="closeModal($event)">Cancelar</button>
             <button class="btn-save" (click)="saveReward()" [disabled]="saving()">
                {{ saving() ? '💾 Guardando...' : '💾 Guardar Recompensa' }}
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

    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap; }
    .title { font-weight: 900; font-size: 2rem; color: #F2E74B; margin: 0; }
    .subtitle { color: #ccc; margin: 0.5rem 0 0 0; }
    .header-actions { display: flex; gap: 1rem; }

    .export-btn { 
      background: #6C1DDA; border: none; color: white; padding: 0.75rem 1.5rem; 
      border-radius: 0.5rem; cursor: pointer; display: flex; align-items: center; 
      gap: 0.5rem; font-weight: bold; transition: 0.3s;
    }
    .export-btn.secondary { background: rgba(108, 29, 218, 0.3); }
    .export-btn .icon { color: #fff; }
    .export-btn:hover { background: #F2E74B; color: #1A0B2E; transform: translateY(-2px); }
    .export-btn:hover .icon { color: inherit; }
    .create-reward-btn .icon { filter: brightness(5); }

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

    .reward-thumb { width: 50px; height: 50px; border-radius: 0.5rem; object-fit: cover; border: 2px solid #6C1DDA; }
    .stock-badge { background: #00cc66; color: white; padding: 0.2rem 0.6rem; border-radius: 0.3rem; font-size: 0.75rem; font-weight: bold; }
    .stock-badge.low { background: #ff4444; }
    .type-badge { background: rgba(108, 29, 218, 0.3); color: #F2E74B; padding: 0.3rem 0.8rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: bold; }
    .type-badge.digital { background: rgba(242, 231, 75, 0.2); }

    .action-group { display: flex; gap: 0.5rem; justify-content: flex-end; }
    .icon-btn { background: transparent; border: 1px solid rgba(255,255,255,0.2); padding: 0.4rem 0.6rem; border-radius: 0.3rem; cursor: pointer; transition: 0.2s; }
    .icon-btn:hover { background: rgba(108, 29, 218, 0.3); }

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

    /* ADVANCED MODAL */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .reward-editor-modal { background: #1A0B2E; border: 2px solid #6C1DDA; border-radius: 1.5rem; width: 95%; max-width: 1400px; max-height: 95vh; display: flex; flex-direction: column; overflow: hidden; }
    
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 2rem; border-bottom: 1px solid rgba(108, 29, 218, 0.3); }
    .modal-header h3 { margin: 0; color: #F2E74B; font-size: 1.5rem; }
    .close-btn { background: transparent; border: none; color: white; font-size: 1.5rem; cursor: pointer; transition: 0.2s; }
    .close-btn:hover { color: #F2E74B; transform: rotate(90deg); }

    .editor-container { display: grid; grid-template-columns: 450px 1fr; gap: 2rem; padding: 2rem; overflow-y: auto; max-height: calc(95vh - 200px); }
    
    /* LEFT PANEL */
    .editor-left { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group label { color: #F2E74B; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    .form-group input[type="text"], .form-group input[type="number"], .form-group textarea { 
      background: rgba(255,255,255,0.05); border: 1px solid rgba(108, 29, 218, 0.4); 
      color: white; padding: 0.8rem 1rem; border-radius: 0.6rem; outline: none; transition: 0.3s;
      font-family: inherit;
    }
    .form-group input:focus, .form-group textarea:focus { border-color: #F2E74B; background: rgba(108, 29, 218, 0.1); }
    .form-group textarea { resize: vertical; min-height: 80px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .file-input { background: rgba(108, 29, 218, 0.2); border: 1px dashed #6C1DDA; padding: 0.8rem; border-radius: 0.6rem; color: white; cursor: pointer; }
    .help-text { font-size: 0.7rem; color: #888; margin-top: 0.2rem; }

    .type-selector { display: flex; gap: 0.5rem; }
    .type-btn { flex: 1; background: rgba(255,255,255,0.05); border: 2px solid rgba(108, 29, 218, 0.3); color: #ccc; padding: 0.8rem 1rem; border-radius: 0.6rem; cursor: pointer; font-weight: bold; transition: 0.3s; }
    .type-btn:hover { background: rgba(108, 29, 218, 0.2); }
    .type-btn.active { background: #6C1DDA; border-color: #F2E74B; color: white; }
    .type-btn.small { padding: 0.6rem 0.8rem; font-size: 0.85rem; }

    .digital-section { background: rgba(108, 29, 218, 0.1); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(108, 29, 218, 0.3); }
    .section-header h4 { margin: 0 0 1rem 0; color: #F2E74B; font-size: 1rem; }

    .code-areas-manager { margin-top: 1.5rem; }
    .areas-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; gap: 1rem; }
    .areas-header > div { flex: 1; }
    .areas-header label { display: block; color: #F2E74B; font-size: 0.85rem; font-weight: bold; margin-bottom: 0.3rem; }
    .btn-add-area { background: #F2E74B; border: none; color: #1A0B2E; padding: 0.6rem 1.2rem; border-radius: 0.5rem; font-weight: bold; cursor: pointer; transition: 0.3s; white-space: nowrap; font-size: 0.85rem; }
    .btn-add-area:hover { background: #6C1DDA; color: white; transform: translateY(-2px); }
    .areas-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .area-item { background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 0.6rem; border: 1px solid rgba(108, 29, 218, 0.3); display: flex; justify-content: space-between; align-items: center; gap: 1rem; transition: 0.2s; }
    .area-item:hover { border-color: #F2E74B; background: rgba(108, 29, 218, 0.15); }
    .area-info { display: flex; flex-direction: column; gap: 0.3rem; flex: 1; }
    .area-number { color: #F2E74B; font-weight: bold; font-size: 0.9rem; }
    .area-coords { color: #888; font-size: 0.75rem; font-family: monospace; }
    .area-controls { display: flex; align-items: center; gap: 0.75rem; }
    .font-control { display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.05); padding: 0.4rem 0.8rem; border-radius: 0.4rem; border: 1px solid rgba(108, 29, 218, 0.3); }
    .font-control label { color: #ccc; font-size: 0.75rem; margin: 0; }
    .font-control input { width: 50px; background: rgba(0,0,0,0.3); border: 1px solid rgba(108, 29, 218, 0.3); color: white; padding: 0.3rem 0.5rem; border-radius: 0.3rem; text-align: center; }
    .font-control .unit { color: #888; font-size: 0.75rem; }
    .btn-remove { background: rgba(255,0,0,0.1); border: 1px solid rgba(255,0,0,0.3); color: #ff4444; padding: 0.4rem 0.6rem; border-radius: 0.3rem; cursor: pointer; transition: 0.2s; }
    .btn-remove:hover { background: #ff4444; color: white; border-color: #ff4444; }
    .areas-empty { text-align: center; padding: 2rem; color: #888; background: rgba(0,0,0,0.2); border-radius: 0.6rem; border: 1px dashed rgba(108, 29, 218, 0.3); }
    .areas-empty p { margin: 0; font-size: 0.85rem; }

    /* RIGHT PANEL */
    .editor-right { display: flex; flex-direction: column; }
    .preview-container { background: rgba(0,0,0,0.3); border: 2px solid rgba(108, 29, 218, 0.3); border-radius: 1rem; padding: 1.5rem; height: 100%; display: flex; flex-direction: column; }
    .preview-container h4 { margin: 0 0 1rem 0; color: #F2E74B; }
    
    .image-preview { flex: 1; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); border-radius: 0.5rem; overflow: hidden; }
    .image-preview img { max-width: 100%; max-height: 400px; object-fit: contain; }

    .pdf-preview-wrapper { flex: 1; overflow: auto; }
    .pdf-canvas-container { position: relative; display: inline-block; min-height: 200px; }
    .pdf-canvas-container canvas { display: block; border: 1px solid rgba(108, 29, 218, 0.5); }
    .pdf-loading { 
      position: absolute; 
      top: 50%; 
      left: 50%; 
      transform: translate(-50%, -50%); 
      color: #F2E74B; 
      font-size: 1.2rem; 
      text-align: center;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .code-area-box { 
      position: absolute; 
      border: 2px solid #F2E74B; 
      background: rgba(242, 231, 75, 0.2); 
      cursor: move;
      min-width: 50px;
      min-height: 30px;
    }
    .area-label { 
      position: absolute; 
      top: -20px; 
      left: 0; 
      background: #F2E74B; 
      color: #1A0B2E; 
      padding: 0.2rem 0.5rem; 
      font-size: 0.7rem; 
      font-weight: bold; 
      border-radius: 0.3rem;
      white-space: nowrap;
    }
    .resize-handle { 
      position: absolute; 
      bottom: 0; 
      right: 0; 
      width: 15px; 
      height: 15px; 
      background: #F2E74B; 
      cursor: nwse-resize;
      border-radius: 0 0 0.3rem 0;
    }
    .demo-text {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      font-weight: bold;
      pointer-events: none;
      overflow: hidden;
      white-space: nowrap;
    }

    .preview-placeholder { flex: 1; display: flex; align-items: center; justify-content: center; color: #888; font-size: 1.2rem; text-align: center; }

    .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; padding: 1.5rem 2rem; border-top: 1px solid rgba(108, 29, 218, 0.3); }
    .btn-cancel { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #ccc; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold; }
    .btn-save { background: #F2E74B; border: none; color: #1A0B2E; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold; transition: 0.3s; }
    .btn-save:hover { background: #6C1DDA; color: white; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

    @media (max-width: 1100px) {
      .admin-page { margin-left: 0; padding: 5rem 1rem 2rem 1rem; }
      .header-row { flex-direction: column; align-items: flex-start; }
      .editor-container { grid-template-columns: 1fr; }
      .hide-mobile { display: none; }
      .btn-text { display: none; }
      .export-btn { border-radius: 50%; width: 45px; height: 45px; padding: 0; justify-content: center; }
    }
  `]
})
export class AdminRewardFormComponent implements OnInit, AfterViewInit {
  @ViewChild('pdfCanvas') pdfCanvas!: ElementRef<HTMLCanvasElement>;
  rewards = signal<any[]>([]);
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 10;
  Math = Math;
  dataVersion = signal(0);

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
  showCreateModal = false;
  editingReward: any = null;
  selectedImagePreview: string | null = null;
  selectedImage: File | null = null;
  selectedPDF: File | null = null;
  saving = signal(false);
  pdfLoaded = signal(false);

  // Wallpaper Logic
  isWallpaperMode = signal(false);
  digitalSubtype = signal<'pdf' | 'wallpaper'>('pdf');
  wallpaperPreview = signal<string | null>(null);

  codeAreas = signal<CodeArea[]>([]);
  environment = environment;

  // Drag state
  draggingIndex: number | null = null;
  resizingIndex: number | null = null;
  dragStartX = 0;
  dragStartY = 0;
  dragStartAreaX = 0;
  dragStartAreaY = 0;
  dragStartWidth = 0;
  dragStartHeight = 0;

  private http = inject(HttpClient);
  public layoutService = inject(AdminLayoutService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadRewards();

    // Global mouse handlers for drag/resize
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  loadRewards() {
    const mockData = [
      { id: 1, title: 'Audífonos Bluetooth Pro', type: 'physical', cost: 5000, stock: 25, active: 1, image_url: '', pdf_template: '', coordinates: '' },
      { id: 2, title: 'Mochila Takis Edición Especial', type: 'physical', cost: 3500, stock: 15, active: 1, image_url: '', pdf_template: '', coordinates: '' },
      { id: 3, title: 'Certificado Digital $500', type: 'digital', cost: 10000, stock: 999, active: 1, image_url: '', pdf_template: 'cert_template.pdf', coordinates: '100,200' },
      { id: 4, title: 'Sudadera Takis Limited', type: 'physical', cost: 7500, stock: 8, active: 1, image_url: '', pdf_template: '', coordinates: '' },
      { id: 5, title: 'Gorra Takis Flare', type: 'physical', cost: 2000, stock: 50, active: 1, image_url: '', pdf_template: '', coordinates: '' }
    ];

    this.http.get(`${environment.apiUrl}/admin/rewards`).subscribe({
      next: (res: any) => {
        if (Array.isArray(res) && res.length > 0) {
          this.rewards.set(res);
        } else {
          this.rewards.set(mockData);
        }
      },
      error: (e: any) => {
        console.error('API rewards error, using mock data:', e);
        this.rewards.set(mockData);
      }
    });
  }

  filteredRewards = computed(() => {
    this.dataVersion();
    const term = this.searchTerm().toLowerCase();
    return this.rewards().filter((r: any) =>
      r.title?.toLowerCase().includes(term) ||
      r.type?.toLowerCase().includes(term)
    );
  });

  paginatedRewards = computed(() => {
    const data = this.filteredRewards();
    const start = (this.currentPage() - 1) * this.pageSize;
    return data.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredRewards().length / this.pageSize));

  ngAfterViewInit() {
    // Canvas will be available after view init
  }

  openCreateModal() {
    this.editingReward = {
      title: '',
      type: 'physical',
      cost: 0,
      stock: 0,
      active: 1,
      image_url: '',
      pdf_template: '',
      coordinates: ''
    };
    this.selectedImagePreview = null;
    this.selectedImage = null;
    this.selectedPDF = null;
    this.pdfLoaded.set(false);
    this.selectedPDF = null;
    this.pdfLoaded.set(false);
    this.codeAreas.set([]);
    this.isWallpaperMode.set(false);
    this.wallpaperPreview.set(null);
    this.showCreateModal = true;
  }

  editReward(reward: any) {
    this.editingReward = { ...reward };
    this.selectedImagePreview = null;
    this.selectedImage = null;
    this.selectedPDF = null;
    this.pdfLoaded.set(false);
    this.digitalSubtype.set('pdf'); // Default to PDF

    // Parse existing code areas if available (use code_areas, fallback to coordinates for legacy)
    if (reward.code_areas) {
      const areasArray = reward.code_areas.split(';').filter((c: string) => c);
      this.codeAreas.set(areasArray.map((areaStr: string, idx: number) => {
        const [x, y, w, h, fs] = areaStr.split(',').map(Number);
        return { id: idx, x: x || 100, y: y || 100, width: w || 150, height: h || 40, fontSize: fs || 14 };
      }));
    } else if (reward.coordinates) {
      // Legacy fallback
      const coordsArray = reward.coordinates.split(';').filter((c: string) => c);
      this.codeAreas.set(coordsArray.map((coord: string, idx: number) => {
        const [x, y, w, h, fs] = coord.split(',').map(Number);
        return { id: idx, x: x || 100, y: y || 100, width: w || 150, height: h || 40, fontSize: fs || 14 };
      }));
    } else {
      this.codeAreas.set([]);
    }

    // Load PDF or Wallpaper if exists
    if (reward.pdf_template) {
      const ext = reward.pdf_template.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png'].includes(ext)) {
        this.isWallpaperMode.set(true);
        this.digitalSubtype.set('wallpaper');
        this.wallpaperPreview.set(`${environment.uploadsUrl}/templates/${reward.pdf_template}`);
      } else {
        this.isWallpaperMode.set(false);
        this.digitalSubtype.set('pdf');
        this.loadExistingPDF(reward.pdf_template);
      }
    }

    this.showCreateModal = true;
  }

  closeModal(event: Event) {
    event.stopPropagation();
    this.showCreateModal = false;
    this.editingReward = null;
    this.pdfLoaded.set(false);
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onWallpaperSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedPDF = file; // We use selectedPDF variable for upload as well
      this.isWallpaperMode.set(true);

      const reader = new FileReader();
      reader.onload = (e: any) => this.wallpaperPreview.set(e.target.result);
      reader.readAsDataURL(file);
      this.pdfLoaded.set(false);
    }
  }

  onPDFSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedPDF = file;
      this.isWallpaperMode.set(false);
      this.loadPDFPreview(file);
    }
  }

  async loadPDFPreview(file: File) {
    try {
      // Wait for PDF.js to be available
      let attempts = 0;
      while (!(window as any)['pdfjsLib'] && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      const pdfjsLib = (window as any)['pdfjsLib'];
      if (!pdfjsLib) {
        console.error('PDF.js library not available after waiting');
        this.toastService.show('Error: La librería PDF.js no está disponible. Por favor recarga la página.', 'error', 5000);
        return;
      }

      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      // Force change detection and wait for canvas
      this.cdr.detectChanges();

      // Multiple attempts to find canvas
      let canvasAttempts = 0;
      const renderPDF = async () => {
        const canvas = this.pdfCanvas?.nativeElement;

        if (!canvas && canvasAttempts < 20) {
          canvasAttempts++;
          await new Promise(resolve => setTimeout(resolve, 100));
          return renderPDF();
        }

        if (!canvas) {
          console.error('Canvas element not found after multiple attempts');
          this.toastService.show('Error: No se pudo cargar el visor PDF. Intenta cerrar y abrir el modal nuevamente.', 'error', 5000);
          return;
        }

        const viewport = page.getViewport({ scale: 1.5 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext('2d');
        if (context) {
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          this.pdfLoaded.set(true);
          this.toastService.show('PDF cargado exitosamente', 'success');

          // Convert stored percentages to pixels if editing
          if (this.editingReward && this.editingReward.coordinates) {
            this.convertPercentagesToPixels(canvas.width, canvas.height);
          }
        }
      };

      await renderPDF();
    } catch (error) {
      console.error('Error loading PDF:', error);
      this.toastService.show('Error al cargar el PDF: ' + (error as Error).message, 'error', 5000);
    }
  }

  async loadExistingPDF(filename: string) {
    try {
      const pdfjsLib = (window as any)['pdfjsLib'];
      if (!pdfjsLib) {
        this.toastService.show('PDF.js no está disponible', 'error');
        return;
      }

      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const pdfUrl = `${environment.uploadsUrl}/templates/${filename}`;
      const loadingTask = pdfjsLib.getDocument({ url: pdfUrl, withCredentials: false });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      this.cdr.detectChanges();

      // Multiple attempts to find canvas
      let canvasAttempts = 0;
      const renderPDF = async () => {
        const canvas = this.pdfCanvas?.nativeElement;

        if (!canvas && canvasAttempts < 20) {
          canvasAttempts++;
          await new Promise(resolve => setTimeout(resolve, 100));
          return renderPDF();
        }

        if (!canvas) {
          this.toastService.show('No se pudo cargar el visor PDF', 'error');
          return;
        }

        const viewport = page.getViewport({ scale: 1.5 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext('2d');
        if (context) {
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          this.pdfLoaded.set(true);

          // Convert stored percentages to pixels if editing
          if (this.editingReward && this.editingReward.coordinates) {
            this.convertPercentagesToPixels(canvas.width, canvas.height);
          }
        }
      };

      await renderPDF();
    } catch (error) {
      console.error('Error loading existing PDF:', error);
      this.toastService.show('Error al cargar el PDF existente', 'error');
    }
  }

  addCodeArea() {
    const newArea: CodeArea = {
      id: this.codeAreas().length,
      x: 100,
      y: 100,
      width: 150,
      height: 40,
      fontSize: 14
    };
    this.codeAreas.update(areas => [...areas, newArea]);
  }

  removeCodeArea(index: number) {
    this.codeAreas.update(areas => areas.filter((_, i) => i !== index));
  }

  startDrag(event: MouseEvent, index: number) {
    event.preventDefault();
    event.stopPropagation();
    this.draggingIndex = index;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartAreaX = this.codeAreas()[index].x;
    this.dragStartAreaY = this.codeAreas()[index].y;
  }

  startResize(event: MouseEvent, index: number) {
    event.preventDefault();
    event.stopPropagation();
    this.resizingIndex = index;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartWidth = this.codeAreas()[index].width;
    this.dragStartHeight = this.codeAreas()[index].height;
  }

  onMouseMove(event: MouseEvent) {
    if (this.draggingIndex !== null) {
      const deltaX = event.clientX - this.dragStartX;
      const deltaY = event.clientY - this.dragStartY;

      this.codeAreas.update(areas => {
        const updated = [...areas];
        updated[this.draggingIndex!].x = Math.max(0, this.dragStartAreaX + deltaX);
        updated[this.draggingIndex!].y = Math.max(0, this.dragStartAreaY + deltaY);
        return updated;
      });
    }

    if (this.resizingIndex !== null) {
      const deltaX = event.clientX - this.dragStartX;
      const deltaY = event.clientY - this.dragStartY;

      this.codeAreas.update(areas => {
        const updated = [...areas];
        updated[this.resizingIndex!].width = Math.max(50, this.dragStartWidth + deltaX);
        updated[this.resizingIndex!].height = Math.max(30, this.dragStartHeight + deltaY);
        return updated;
      });
    }
  }

  onMouseUp() {
    this.draggingIndex = null;
    this.resizingIndex = null;
  }

  private convertPercentagesToPixels(canvasWidth: number, canvasHeight: number) {
    const rawCoords = this.editingReward.code_areas || this.editingReward.coordinates;
    if (!rawCoords) return;

    try {
      if (rawCoords.trim().startsWith('[')) {
        // Handle JSON format (Legacy)
        const parsed = JSON.parse(rawCoords);
        this.codeAreas.set(parsed.map((c: any, idx: number) => ({
          id: idx,
          x: (c.x / 100) * canvasWidth,
          y: (c.y / 100) * canvasHeight,
          width: (c.w / 100) * canvasWidth,
          height: (c.h / 100) * canvasHeight,
          fontSize: c.fontSize || 14
        })));
      } else {
        // Handle Semicolon format (New)
        const coordsArray = rawCoords.split(';').filter((c: string) => c);
        this.codeAreas.set(coordsArray.map((coord: string, idx: number) => {
          const [xPct, yPct, wPct, hPct, fs] = coord.split(',').map(Number);
          return {
            id: idx,
            x: (xPct / 100) * canvasWidth,
            y: (yPct / 100) * canvasHeight,
            width: (wPct / 100) * canvasWidth,
            height: (hPct / 100) * canvasHeight,
            fontSize: fs || 14
          };
        }));
      }
    } catch (e) {
      console.error('Error parsing coordinates:', e);
    }
  }

  async saveReward() {
    this.saving.set(true);

    // Validation
    if (!this.editingReward.title) {
      this.toastService.show('❌ El título es obligatorio', 'error');
      this.saving.set(false);
      return;
    }
    if (!this.editingReward.description) {
      this.toastService.show('❌ La descripción es obligatoria', 'error');
      this.saving.set(false);
      return;
    }
    if (this.editingReward.cost === null || this.editingReward.cost === undefined || this.editingReward.cost < 0) {
      this.toastService.show('❌ El costo en puntos es inválido', 'error');
      this.saving.set(false);
      return;
    }
    if (this.editingReward.stock === null || this.editingReward.stock === undefined || this.editingReward.stock < 0) {
      this.toastService.show('❌ El stock es inválido', 'error');
      this.saving.set(false);
      return;
    }

    // Specific validation based on type
    // Specific validation based on type
    if (this.editingReward.type === 'physical') {
      if (!this.editingReward.image_url && !this.selectedImage) {
        this.toastService.show('❌ Debes subir una imagen para recompensas físicas', 'error');
        this.saving.set(false);
        return;
      }
    } else if (this.editingReward.type === 'digital') {
      if (!this.editingReward.pdf_template && !this.selectedPDF) {
        this.toastService.show('❌ Debes subir un archivo para la recompensa digital', 'error');
        this.saving.set(false);
        return;
      }
      // ONLY validate Code Areas if PDF mode
      if (this.digitalSubtype() === 'pdf' && this.codeAreas().length === 0) {
        this.toastService.show('❌ Define al menos un área de código para el PDF', 'error');
        this.saving.set(false);
        return;
      }
    }

    try {
      // Upload image if selected
      if (this.selectedImage) {
        const imageFormData = new FormData();
        imageFormData.append('image', this.selectedImage);
        const imageRes: any = await this.http.post(`${environment.apiUrl}/admin/upload/reward-image`, imageFormData).toPromise();
        if (imageRes.filename) {
          this.editingReward.image_url = imageRes.filename;
        }
      }

      // Upload PDF if selected
      if (this.selectedPDF) {
        const pdfFormData = new FormData();
        pdfFormData.append('template', this.selectedPDF);
        const pdfRes: any = await this.http.post(`${environment.apiUrl}/admin/upload/template`, pdfFormData).toPromise();
        if (pdfRes.filename) {
          this.editingReward.pdf_template = pdfRes.filename;
        }
      }

      // Serialize code areas as percentages (Only if PDF loaded and NOT wallpaper)
      if (this.codeAreas().length > 0 && this.pdfCanvas && !this.isWallpaperMode()) {
        const canvas = this.pdfCanvas.nativeElement;
        this.editingReward.code_areas = this.codeAreas()
          .map(area => {
            const xPct = (area.x / canvas.width) * 100;
            const yPct = (area.y / canvas.height) * 100;
            const wPct = (area.width / canvas.width) * 100;
            const hPct = (area.height / canvas.height) * 100;
            return `${xPct.toFixed(2)},${yPct.toFixed(2)},${wPct.toFixed(2)},${hPct.toFixed(2)},${area.fontSize}`;
          })
          .join(';');

        // Backup for legacy compatibility (JSON format)
        this.editingReward.coordinates = JSON.stringify(this.codeAreas().map(area => ({
          x: (area.x / canvas.width) * 100,
          y: (area.y / canvas.height) * 100,
          w: (area.width / canvas.width) * 100,
          h: (area.height / canvas.height) * 100
        })));
      } else if (this.isWallpaperMode()) {
        // Clear code areas for wallpaper
        this.editingReward.code_areas = '';
        this.editingReward.coordinates = '';
      }

      // Save or update reward
      if (this.editingReward.id) {
        await this.http.put(`${environment.apiUrl}/admin/rewards/update/${this.editingReward.id}`, this.editingReward).toPromise();
        this.rewards.update(list => list.map(r => r.id === this.editingReward.id ? this.editingReward : r));
        this.toastService.show('✅ Recompensa actualizada exitosamente', 'success');
      } else {
        const res: any = await this.http.post(`${environment.apiUrl}/admin/rewards/create`, this.editingReward).toPromise();
        if (res.id) {
          this.editingReward.id = res.id;
          this.rewards.update(list => [...list, this.editingReward]);
          this.toastService.show('✅ Recompensa creada exitosamente', 'success');
        }
      }

      this.saving.set(false);
      this.showCreateModal = false;
      this.editingReward = null;
      this.loadRewards(); // Reload to get fresh data from server
    } catch (error) {
      console.error('Error saving reward:', error);
      this.toastService.show('❌ Error al guardar la recompensa. Por favor intenta de nuevo.', 'error');
      this.saving.set(false);
    }
  }


  deleteReward(id: number) {
    if (!confirm('¿Estás seguro de eliminar esta recompensa?')) return;

    this.http.delete(`${environment.apiUrl}/admin/rewards/${id}`).subscribe({
      next: () => {
        this.rewards.update(list => list.filter(r => r.id !== id));
      },
      error: (e: any) => console.error('Error deleting reward:', e)
    });
  }

  exportToCSV() {
    const headers = ['ID', 'Título', 'Tipo', 'Puntos', 'Stock', 'Estado'];
    const rows = this.filteredRewards().map((r: any) => [
      r.id,
      `"${r.title}"`,
      r.type,
      r.cost,
      r.stock,
      r.active ? 'Activo' : 'Inactivo'
    ]);

    const csvContent = "\ufeff" + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "recompensas_takis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
