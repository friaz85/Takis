import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {
    constructor() { }

    /**
     * Pushes an event and data to the GTM dataLayer
     * @param eventName Name of the event to track
     * @param data Additional data variables
     */
    trackEvent(eventName: string, data: any = {}) {
        if ((window as any).dataLayer) {
            (window as any).dataLayer.push({
                event: eventName,
                ...data
            });
            console.log(`[Analytics] Event tracked: ${eventName}`, data);
        }
    }

    /**
     * Specifically track conversions (Registration or Redemption)
     */
    trackConversion(type: 'registration' | 'redemption', id: string | number, extra: any = {}) {
        this.trackEvent(`${type}_complete`, {
            orderId: id.toString(),
            conversionType: type,
            ...extra
        });
    }
}
