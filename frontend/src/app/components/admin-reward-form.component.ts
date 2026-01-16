import { Component, signal, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNavbarComponent } from './admin-navbar.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-admin-reward-form',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbarComponent],
  template: `
    <app-admin-navbar></app-admin-navbar>
    <div class="rewards-page">
      <div class="header-row">
        <div>
          <h2 class="title">GESTIÓN DE RECOMPENSAS</h2>
          <p class="subtitle">Administra el catálogo de recompensas físicas y digitales</p>
        </div>
        <button class="add-btn" (click)="openModal()">
          <span class="icon">+</span> NUEVA RECOMPENSA
        </button>
      </div>

      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th width="80">IMAGEN</th>
              <th>TÍTULO</th>
              <th>TIPO</th>
              <th>COSTO (PTS)</th>
              <th>STOCK</th>
              <th>PLANTILLA</th>
              <th width="150" class="text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            @for (reward of rewards(); track reward.id) {
              <tr>
                <td>
                  <div class="img-thumb">
                    <img [src]="reward.image_url ? 'https://takis.qrewards.com.mx/api/uploads/rewards/' + reward.image_url : 'assets/takis-piece.png'" alt="Img">
                  </div>
                </td>
                <td class="font-bold">{{ reward.title }}</td>
                <td>
                  <span class="badge" [class]="reward.type">{{ reward.type === 'physical' ? 'FÍSICO' : 'DIGITAL' }}</span>
                </td>
                <td class="text-gold">{{ reward.cost | number }}</td>
                <td>{{ reward.stock }}</td>
                <td>
                  <span *ngIf="reward.type === 'digital'" class="text-xs text-gray">
                    {{ reward.pdf_template ? 'PDF Cargado' : 'Sin PDF' }}
                  </span>
                  <span *ngIf="reward.type !== 'digital'">-</span>
                </td>
                <td class="text-right">
                  <div class="action-buttons">
                    <button class="icon-btn edit" (click)="openModal(reward)" title="Editar">✏️</button>
                    <button class="icon-btn delete" (click)="deleteReward(reward)" title="Eliminar">🗑️</button>
                  </div>
                </td>
              </tr>
            }
            @if (rewards().length === 0) {
              <tr>
                <td colspan="7" class="empty-cell">No hay recompensas registradas.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL -->
    <div class="modal-overlay" *ngIf="isModalOpen" (click)="closeModal()">
      <div class="modal-panel" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editingReward ? 'EDITAR' : 'NUEVA' }} RECOMPENSA</h3>
          <button class="close-btn" (click)="closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <!-- Columna Izquierda: Formulario -->
          <div class="form-column">
            
            <div class="field-group">
              <label>Título de la Recompensa</label>
              <input type="text" [(ngModel)]="currentReward.title" placeholder="Ej: Takis Fuego 200g">
            </div>

            <div class="field-group">
              <label>Imagen de la Recompensa</label>
              <input type="file" (change)="onImageSelected($event)" accept="image/*" class="file-input">
              <small *ngIf="currentReward.image_url" class="file-info">Actual: {{ currentReward.image_url }}</small>
            </div>

            <div class="field-group">
              <label>Descripción</label>
              <textarea [(ngModel)]="currentReward.description" rows="3" placeholder="Detalles de la recompensa..."></textarea>
            </div>
            
            <div class="row">
              <div class="field-group">
                <label>Costo (Puntos)</label>
                <input type="number" [(ngModel)]="currentReward.cost">
              </div>
              <div class="field-group">
                <label>Stock Inicial</label>
                <input type="number" [(ngModel)]="currentReward.stock">
              </div>
            </div>

            <div class="field-group">
              <label>Tipo de Recompensa</label>
              <div class="type-selector">
                <button [class.active]="currentReward.type === 'physical'" (click)="setRewardType('physical')">📦 FÍSICO</button>
                <button [class.active]="currentReward.type === 'digital'" (click)="setRewardType('digital')">📄 DIGITAL (PDF)</button>
              </div>
            </div>

            <div class="field-group" *ngIf="currentReward.type === 'digital'">
               <div class="alert-box">
                  <label class="required">Plantilla PDF</label>
                  <input type="file" (change)="onPdfSelected($event)" accept=".pdf,application/pdf" class="file-input">
                  <small class="hint">Sube el PDF base y configura la zona de impresión a la derecha.</small>
               </div>
            </div>

          </div>

          <!-- Columna Derecha: Preview PDF (Solo Digital) -->
          <div class="preview-column" *ngIf="currentReward.type === 'digital'">
            <div class="preview-header">
                <label>Zona de Previsualización</label>
                <div class="controls">
                   <button class="btn-add-code" (click)="addCodeBox()">+ Agregar Caja</button>
                </div>
            </div>
            
            <div class="pdf-wrapper">
               <div class="pdf-container" #pdfContainer>
                  <object *ngIf="pdfPreviewUrl" [data]="pdfPreviewUrl" type="application/pdf" class="pdf-object">
                      <p>Tu navegador no soporta visualización de PDF.</p>
                  </object>
                  <div *ngIf="!pdfPreviewUrl" class="no-pdf">
                    <span>Sube un PDF para configurar las coordenadas</span>
                  </div>

                  <!-- Overlay -->
                  <div class="drag-overlay" 
                       (mousemove)="onDrag($event)" 
                       (mouseup)="stopInteraction()" 
                       (mouseleave)="stopInteraction()">
                      
                      @if (codeBoxes.length === 0 && pdfPreviewUrl) {
                        <div class="empty-boxes-hint">
                           <span class="hint-icon">👆</span>
                           <h4 class="hint-title">Configura tu plantilla</h4>
                           <p class="hint-desc">Usa el botón <strong>"+ Agregar Caja"</strong> para definir dónde imprimir el código</p>
                        </div>
                      }

                      @for (box of codeBoxes; track $index) {
                          <div class="code-box" 
                             [class.dragging]="activeDragIndex === $index"
                             [class.resizing]="activeResizeIndex === $index"
                             (mousedown)="startDrag($event, $index)"
                             [style.left.%]="box.x" 
                             [style.top.%]="box.y"
                             [style.width.%]="box.w || 20"
                             [style.height.%]="box.h || 5">
                            
                            <span class="code-label">CODE</span>
                            <span class="code-remove" (mousedown)="removeBox($index, $event)" title="Eliminar">×</span>
                            <div class="resize-handle" (mousedown)="startResize($event, $index)"></div>
                          </div>
                      }
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button (click)="closeModal()" class="btn-cancel">Cancelar</button>
          <button (click)="save()" class="btn-save" [disabled]="saving">
            {{ saving ? 'Guardando...' : 'Guardar Recompensa' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rewards-page { padding: 3rem 3rem 3rem calc(260px + 3rem); background: transparent; min-height: 100vh; color: #E0E0E0; font-family: 'Inter', sans-serif; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .title { font-weight: 800; font-size: 2rem; margin: 0; color: white; letter-spacing: -1px; }
    .subtitle { color: #aaa; margin: 0.5rem 0 0 0; font-size: 0.9rem; }
    .add-btn { background: #F2E74B; color: #1A0B2E; border: none; padding: 0.8rem 1.5rem; border-radius: 0.5rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
    
    .table-card { background: #1A0B2E; border-radius: 1rem; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th { background: #23113a; padding: 1.2rem; font-size: 0.75rem; color: #888; text-transform: uppercase; font-weight: 600; border-bottom: 2px solid rgba(255,255,255,0.05); }
    .data-table td { padding: 1rem 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }
    .img-thumb { width: 40px; height: 40px; border-radius: 6px; overflow: hidden; background: white; }
    .img-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; }
    .badge.physical { background: rgba(50, 255, 100, 0.1); color: #4eff88; }
    .badge.digital { background: rgba(100, 200, 255, 0.1); color: #64b5f6; }
    .icon-btn { background: transparent; border: none; cursor: pointer; font-size: 1.2rem; padding: 5px; opacity: 0.7; }
    
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 200; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
    .modal-panel { background: #150a25; width: 95%; max-width: 1400px; height: 95vh; border-radius: 1rem; border: 1px solid #6C1DDA; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 0 50px rgba(0,0,0,0.5); }
    .modal-header { padding: 1rem 1.5rem; background: #1A0B2E; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; color: white; }
    .close-btn { background: transparent; border: none; color: #aaa; font-size: 1.5rem; cursor: pointer; }
    .modal-body { flex: 1; display: flex; overflow: hidden; }
    .form-column { width: 350px; padding: 1.5rem; border-right: 1px solid rgba(255,255,255,0.1); overflow-y: auto; background: #120820; flex-shrink: 0; }
    .preview-column { flex: 1; padding: 0; background: #000; display: flex; flex-direction: column; overflow: hidden; position: relative; }
    .preview-header { padding: 1rem; background: rgba(26, 11, 46, 0.9); display: flex; justify-content: space-between; align-items: center; position: absolute; top: 0; left: 0; right: 0; z-index: 50; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .btn-add-code { background: #F2E74B; color: #1A0B2E; border: none; padding: 0.5rem 1rem; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 0.8rem; }
    .pdf-wrapper { flex: 1; overflow: hidden; display: flex; justify-content: center; align-items: center; padding-top: 60px; }
    .pdf-container { position: relative; width: 100%; height: 100%; display: flex; justify-content: center; background: #333; }
    .pdf-object { width: 100%; height: 100%; display: block; border: none; }
    .drag-overlay { position: absolute; inset: 0; z-index: 10; width: 100%; height: 100%; pointer-events: auto; }
    
    .type-selector { display: flex; gap: 0.5rem; background: rgba(255,255,255,0.05); padding: 5px; border-radius: 0.5rem; margin-top: 0.5rem; }
    .type-selector button { flex: 1; background: transparent; border: none; color: #aaa; padding: 0.8rem; border-radius: 0.4rem; cursor: pointer; font-weight: 700; font-size: 0.9rem; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.5px; }
    .type-selector button.active { background: #6C1DDA; color: white; box-shadow: 0 4px 10px rgba(108, 29, 218, 0.3); }
    
    .code-box { position: absolute; background: rgba(242, 231, 75, 0.3); border: 2px dashed #F2E74B; color: #FFF; display: flex; align-items: center; justify-content: center; cursor: move; font-size: 0.7rem; font-weight: bold; text-shadow: 0 1px 2px black; user-select: none; box-sizing: border-box; }
    .code-box:hover { background: rgba(242, 231, 75, 0.5); }
    .code-box.dragging { border-style: solid; box-shadow: 0 0 15px rgba(242, 231, 75, 0.5); z-index: 100; }
    .code-box.resizing { cursor: nwse-resize; }
    .code-label { pointer-events: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .code-remove { position: absolute; top: -10px; right: -10px; width: 20px; height: 20px; background: #ff4444; color: white; border-radius: 50%; font-size: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid white; z-index: 101; }
    .resize-handle { position: absolute; bottom: 0; right: 0; width: 15px; height: 15px; background: rgba(255,255,255,0.5); cursor: nwse-resize; clip-path: polygon(100% 0, 100% 100%, 0 100%); }
    
    .empty-boxes-hint { 
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
      color: white; 
      display: flex; flex-direction: column; align-items: center; gap: 1rem;
      background: rgba(26, 11, 46, 0.85); 
      padding: 2.5rem; border-radius: 1.5rem; 
      border: 1px solid rgba(242, 231, 75, 0.3);
      backdrop-filter: blur(8px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      pointer-events: none; text-align: center;
      max-width: 80%;
      animation: floatHint 3s ease-in-out infinite;
    }
    .hint-icon { font-size: 3rem; margin-bottom: 0.5rem; filter: drop-shadow(0 0 10px rgba(242, 231, 75, 0.5)); }
    .hint-title { font-size: 1.2rem; font-weight: 800; color: #F2E74B; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
    .hint-desc { font-size: 0.9rem; color: #ddd; margin: 0; line-height: 1.5; }
    
    @keyframes floatHint {
      0%, 100% { transform: translate(-50%, -50%); }
      50% { transform: translate(-50%, -55%); }
    }

    .field-group { margin-bottom: 1.5rem; }
    label { display: block; color: #888; font-size: 0.75rem; margin-bottom: 0.5rem; text-transform: uppercase; font-weight: 600; }
    input, textarea { width: 100%; padding: 0.8rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.4rem; color: white; }
    .alert-box { background: rgba(108, 29, 218, 0.2); padding: 1rem; border: 1px solid #6C1DDA; border-radius: 0.5rem; margin-top: 1rem; }
    .modal-footer { padding: 1.5rem; background: #1A0B2E; display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid rgba(255,255,255,0.05); }
    .btn-save { background: #6C1DDA; color: white; border: none; padding: 0.8rem 2rem; border-radius: 0.4rem; font-weight: 700; cursor: pointer; }
    .btn-cancel { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.8rem 1.5rem; border-radius: 0.4rem; font-weight: 600; cursor: pointer; }
  `]
})
export class AdminRewardFormComponent implements OnInit {
  rewards = signal<any[]>([]);
  isModalOpen = false;
  editingReward: any = null;
  saving = false;

  currentReward: any = { type: 'physical', cost: 100, stock: 10, title: '', description: '' };
  codeBoxes: { id: number, x: number, y: number, w: number, h: number }[] = [];

  selectedImage: File | null = null;
  selectedPdf: File | null = null;
  pdfPreviewUrl: SafeResourceUrl | null = null;

  activeDragIndex = -1;
  activeResizeIndex = -1;
  resizeStart = { x: 0, y: 0 };

  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private toast = inject(ToastService);

  ngOnInit() {
    this.loadRewards();
  }

  loadRewards() {
    this.http.get('https://takis.qrewards.com.mx/api/index.php/admin/rewards').subscribe({
      next: (res: any) => {
        const fixedRes = res.map((r: any) => {
          if (typeof r.coordinates === 'string') {
            try { r.coordinates = JSON.parse(r.coordinates); } catch (e) { r.coordinates = []; }
          }
          if (!Array.isArray(r.coordinates) && r.coordinates?.x) {
            r.coordinates = [r.coordinates];
          }
          return r;
        });
        this.rewards.set(fixedRes);
      },
      error: () => this.toast.show('Error al cargar recompensas', 'error')
    });
  }

  setRewardType(type: string) {
    this.currentReward.type = type;
  }

  openModal(reward: any = null) {
    this.editingReward = reward;
    this.selectedImage = null;
    this.selectedPdf = null;
    this.pdfPreviewUrl = null;
    this.codeBoxes = [];

    if (reward) {
      this.currentReward = { ...reward };
      if (reward.pdf_template) {
        const url = 'https://takis.qrewards.com.mx/api/uploads/pdfs/' + reward.pdf_template + '#toolbar=0&navpanes=0&view=Fit';
        this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      }

      if (Array.isArray(reward.coordinates) && reward.coordinates.length > 0) {
        this.codeBoxes = JSON.parse(JSON.stringify(reward.coordinates));
      }
    } else {
      this.currentReward = { type: 'physical', cost: 100, stock: 10, title: '', description: '' };
    }

    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  onImageSelected(event: any) {
    this.selectedImage = event.target.files[0];
  }

  onPdfSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedPdf = file;
      this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        URL.createObjectURL(file) + '#toolbar=0&navpanes=0&view=Fit'
      );
    } else {
      this.toast.show('Solo se admiten archivos PDF.', 'error');
      event.target.value = '';
    }
  }

  addCodeBox() {
    this.codeBoxes.push({ id: Date.now(), x: 40, y: 40, w: 20, h: 5 });
  }

  removeBox(index: number, e: Event) {
    e.stopPropagation();
    e.preventDefault();
    this.codeBoxes.splice(index, 1);
  }

  startDrag(e: MouseEvent, index: number) {
    if (this.currentReward.type !== 'digital') return;
    e.preventDefault();
    e.stopPropagation();
    this.activeDragIndex = index;
  }

  startResize(e: MouseEvent, index: number) {
    if (this.currentReward.type !== 'digital') return;
    e.preventDefault();
    e.stopPropagation();
    this.activeResizeIndex = index;
  }

  onDrag(e: MouseEvent) {
    if (this.activeDragIndex === -1 && this.activeResizeIndex === -1) return;

    e.preventDefault();
    const overlay = e.currentTarget as HTMLElement;
    const rect = overlay.getBoundingClientRect();

    if (this.activeDragIndex !== -1) {
      let x = ((e.clientX - rect.left) / rect.width) * 100;
      let y = ((e.clientY - rect.top) / rect.height) * 100;
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));

      this.codeBoxes[this.activeDragIndex].x = x;
      this.codeBoxes[this.activeDragIndex].y = y;

    } else if (this.activeResizeIndex !== -1) {
      const box = this.codeBoxes[this.activeResizeIndex];
      let mouseXPct = ((e.clientX - rect.left) / rect.width) * 100;
      let mouseYPct = ((e.clientY - rect.top) / rect.height) * 100;

      let newW = mouseXPct - box.x;
      let newH = mouseYPct - box.y;

      if (newW > 1) box.w = newW;
      if (newH > 1) box.h = newH;
    }
  }

  stopInteraction() {
    this.activeDragIndex = -1;
    this.activeResizeIndex = -1;
  }

  async save() {
    this.saving = true;
    try {
      if (this.selectedImage) {
        const formData = new FormData();
        formData.append('image', this.selectedImage);
        const res: any = await this.http.post('https://takis.qrewards.com.mx/api/index.php/admin/upload-image', formData).toPromise();
        this.currentReward.image_url = res.filename;
      }

      if (this.selectedPdf && this.currentReward.type === 'digital') {
        const formData = new FormData();
        formData.append('template', this.selectedPdf);
        const res: any = await this.http.post('https://takis.qrewards.com.mx/api/index.php/admin/upload-pdf', formData).toPromise();
        this.currentReward.pdf_template = res.filename;
      }

      const dataToSend = { ...this.currentReward };
      if (dataToSend.type === 'digital') {
        dataToSend.coordinates = JSON.stringify(this.codeBoxes);
      } else {
        dataToSend.coordinates = JSON.stringify([]);
      }

      const endpoint = this.editingReward
        ? `https://takis.qrewards.com.mx/api/index.php/admin/rewards/${this.editingReward.id}/update`
        : 'https://takis.qrewards.com.mx/api/index.php/admin/rewards';

      this.http.post(endpoint, dataToSend).subscribe({
        next: () => {
          this.toast.show('¡Recompensa guardada!', 'success');
          this.closeModal();
          this.loadRewards();
          this.saving = false;
        },
        error: () => {
          this.toast.show('Error al guardar recompensa.', 'error');
          this.saving = false;
        }
      });
    } catch (e) {
      this.toast.show('Error de conexión o archivo.', 'error');
      this.saving = false;
    }
  }

  deleteReward(reward: any) {
    if (confirm('¿Estás seguro de eliminar esta recompensa?')) {
      this.http.delete(`https://takis.qrewards.com.mx/api/index.php/admin/rewards/${reward.id}`).subscribe({
        next: () => {
          this.toast.show('Eliminado correctamente', 'success');
          this.loadRewards();
        },
        error: () => this.toast.show('Error al eliminar', 'error')
      });
    }
  }
}
