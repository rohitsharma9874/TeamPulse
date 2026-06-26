import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, switchMap, tap } from 'rxjs';
import { LoginRequest, LoginResponse } from '../models/auth.model';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { TenantService } from './tenant.service';

const TOKEN_KEY = 'tp_token';
const USER_KEY = 'tp_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private tenantService: TenantService,
  ) {}

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap(response => {
        sessionStorage.setItem(TOKEN_KEY, response.token);
        const user: User = {
          id: response.id,
          username: response.username,
          name: response.name,
          email: response.email,
          role: response.role,
          companyId: response.companyId,
          department: response.department,
          phone: response.phone,
          photo: response.photo,
        };
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
        // Load tenant branding immediately after login
        this.tenantService.loadForTenant(response.companyId);
      })
    );
  }

  updateCurrentUser(updated: User): void {
    sessionStorage.setItem(USER_KEY, JSON.stringify(updated));
    this.currentUserSubject.next(updated);
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
    this.tenantService.reset();
    this.router.navigate(['/login'], {});
  }

  private loadUser(): User | null {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
