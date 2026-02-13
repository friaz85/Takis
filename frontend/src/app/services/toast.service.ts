import { Injectable, signal } from '@angular/core';
import Swal from 'sweetalert2';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    toasts = signal<Toast[]>([]);

    // SweetAlert2 Toast configuration with Takis styling
    private Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        },
        customClass: {
            popup: 'takis-toast-popup',
            title: 'takis-toast-title',
            icon: 'takis-toast-icon'
        }
    });

    show(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
        const id = Date.now();
        const toast: Toast = { id, message, type, duration };

        // Keep the signal updated for compatibility
        this.toasts.update(current => [...current, toast]);

        // Map types to SweetAlert2 icons
        let icon: 'success' | 'error' | 'info' | 'warning' = type;

        // Show SweetAlert2 Toast with enhanced Takis styling
        this.Toast.fire({
            icon: icon,
            title: message.toUpperCase(),
            timer: duration,
            background: 'linear-gradient(135deg, #6C1DDA 0%, #560E8C 100%)',
            color: '#fff',
            iconColor: type === 'success' ? '#4eff88' : type === 'error' ? '#ff4444' : '#F2E74B',
            width: '350px',
            padding: '1.5rem'
        });

        setTimeout(() => {
            this.remove(id);
        }, duration);
    }

    remove(id: number) {
        this.toasts.update(current => current.filter(t => t.id !== id));
    }
}
