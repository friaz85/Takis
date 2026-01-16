import { Injectable, signal } from '@angular/core';

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

    show(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
        const id = Date.now();
        const toast: Toast = { id, message, type, duration };

        this.toasts.update(current => [...current, toast]);

        setTimeout(() => {
            this.remove(id);
        }, duration);
    }

    remove(id: number) {
        this.toasts.update(current => current.filter(t => t.id !== id));
    }
}
