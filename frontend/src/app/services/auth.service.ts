import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private router = inject(Router);

  // State management with Signals
  private _user = signal<any>(null);
  user = computed(() => this._user());
  isLoggedIn = computed(() => !!this._user());

  constructor() {
    this.checkSession();
  }

  private checkSession() {
    const data = localStorage.getItem('takis_session');
    if (data) {
      try {
        const session = JSON.parse(data);
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - session.timestamp < thirtyDays) {
          this._user.set(session.user);
        } else {
          this.logout();
        }
      } catch (e) {
        this.logout();
      }
    }
  }

  register(formData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, formData);
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/verify-otp`, { email, otp }).pipe(
      tap((res: any) => this.saveSession(res))
    );
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((res: any) => this.saveSession(res))
    );
  }

  // NEW: Login via OTP Request
  requestLoginOtp(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login-otp-request`, { email });
  }

  adminLogin(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/auth/login`, credentials).pipe(
      tap((res: any) => {
        console.log('Admin Login Response:', res);
        this.saveSession(res);
      }),
      catchError((error) => {
        console.error('Admin Login Error:', error);
        return throwError(() => error);
      })
    );
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/profile`, data);
  }

  private saveSession(res: any) {
    if (!res.token || !res.user) return; // Guard logic

    const sessionData = {
      user: res.user,
      token: res.token,
      timestamp: Date.now()
    };
    localStorage.setItem('takis_session', JSON.stringify(sessionData));
    localStorage.setItem('takis_token', res.token);
    this._user.set(res.user);
  }

  logout() {
    localStorage.removeItem('takis_session');
    localStorage.removeItem('takis_token');
    this._user.set(null);
    this.router.navigate(['/auth']);
  }

  getRole(): string {
    return this._user()?.role || 'guest';
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  getToken() {
    return localStorage.getItem('takis_token');
  }
}

export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const token = localStorage.getItem('takis_token');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && error.error?.message?.includes('Sesión expirada')) {
        auth.logout();
      }
      return throwError(() => error);
    })
  );
};
