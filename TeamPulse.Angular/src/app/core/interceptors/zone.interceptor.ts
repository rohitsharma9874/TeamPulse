import { Injectable, NgZone } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class ZoneInterceptor implements HttpInterceptor {
  constructor(private zone: NgZone) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return new Observable(observer => {
      next.handle(req).subscribe({
        next:     event => this.zone.run(() => observer.next(event)),
        error:    err   => this.zone.run(() => observer.error(err)),
        complete: ()    => this.zone.run(() => observer.complete()),
      });
    });
  }
}
