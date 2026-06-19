import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { APP_ROUTES } from './app/app.routes';
import { JwtInterceptor } from './app/core/interceptors/jwt.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(APP_ROUTES),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
  ],
}).catch(err => console.error(err));
