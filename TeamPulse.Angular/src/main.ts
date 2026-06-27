import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, NgZone } from '@angular/core';
import { AppComponent } from './app/app.component';
import { APP_ROUTES } from './app/app.routes';
import { JwtInterceptor } from './app/core/interceptors/jwt.interceptor';
import { ZoneInterceptor } from './app/core/interceptors/zone.interceptor';
import { TenantService } from './app/core/services/tenant.service';

function initTenant(tenantService: TenantService, zone: NgZone): () => Promise<void> {
  return () => {
    const raw = sessionStorage.getItem('tp_user');
    if (!raw) return Promise.resolve();
    try {
      const user = JSON.parse(raw);
      if (user?.companyId) return zone.run(() => tenantService.loadForTenant(user.companyId));
    } catch { /* ignore */ }
    return Promise.resolve();
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(APP_ROUTES, withHashLocation()),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: ZoneInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    {
      provide: APP_INITIALIZER,
      useFactory: initTenant,
      deps: [TenantService, NgZone],
      multi: true,
    },
  ],
}).catch(err => console.error(err));
