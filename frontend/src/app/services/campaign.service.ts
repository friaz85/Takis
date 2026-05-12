import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  private readonly END_DATE = new Date('2026-05-01T00:00:00');
  private readonly FINISH_DATE = new Date('2026-05-12T00:00:00');
  
  isOver = signal(this.checkIfOver());
  isFullyOver = signal(this.checkIfFullyOver());

  constructor() {
    // Check every minute to see if we transitioned
    setInterval(() => {
      this.isOver.set(this.checkIfOver());
      this.isFullyOver.set(this.checkIfFullyOver());
    }, 60000);
  }

  private checkIfOver(): boolean {
    const mexicoTimeStr = new Date().toLocaleString("en-US", {timeZone: "America/Mexico_City"});
    const mexicoTime = new Date(mexicoTimeStr);
    return mexicoTime >= this.END_DATE;
  }

  private checkIfFullyOver(): boolean {
    const mexicoTimeStr = new Date().toLocaleString("en-US", {timeZone: "America/Mexico_City"});
    const mexicoTime = new Date(mexicoTimeStr);
    return mexicoTime >= this.FINISH_DATE;
  }
}
