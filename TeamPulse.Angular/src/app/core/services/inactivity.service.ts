import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, fromEvent, merge, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

const TIMEOUT_MINUTES  = 30;
const WARNING_MINUTES  = 5;
const TIMEOUT_MS       = TIMEOUT_MINUTES * 60 * 1000;
const WARNING_BEFORE_MS = WARNING_MINUTES * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class InactivityService implements OnDestroy {
  readonly showWarning$      = new BehaviorSubject<boolean>(false);
  readonly remainingSeconds$ = new BehaviorSubject<number>(WARNING_MINUTES * 60);

  private timeoutId?:    ReturnType<typeof setTimeout>;
  private warningId?:    ReturnType<typeof setTimeout>;
  private countdownId?:  ReturnType<typeof setInterval>;
  private activitySub?:  Subscription;
  private running = false;

  constructor(private router: Router, private zone: NgZone) {}

  start(): void {
    if (this.running) return;
    this.running = true;

    this.zone.runOutsideAngular(() => {
      const activity$ = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'mousedown'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'touchstart'),
        fromEvent(document, 'scroll', { capture: true }),
      ).pipe(debounceTime(500));

      this.activitySub = activity$.subscribe(() => {
        this.zone.run(() => this.reset());
      });
    });

    this.reset();
  }

  stop(): void {
    this.running = false;
    this.activitySub?.unsubscribe();
    this.activitySub = undefined;
    clearTimeout(this.timeoutId);
    clearTimeout(this.warningId);
    clearInterval(this.countdownId);
    this.showWarning$.next(false);
  }

  keepAlive(): void {
    this.reset();
  }

  private reset(): void {
    clearTimeout(this.timeoutId);
    clearTimeout(this.warningId);
    clearInterval(this.countdownId);
    this.showWarning$.next(false);

    this.warningId = setTimeout(() => {
      this.zone.run(() => this.startCountdown());
    }, TIMEOUT_MS - WARNING_BEFORE_MS);

    this.timeoutId = setTimeout(() => {
      this.zone.run(() => this.forceLogout());
    }, TIMEOUT_MS);
  }

  private startCountdown(): void {
    let remaining = WARNING_MINUTES * 60;
    this.remainingSeconds$.next(remaining);
    this.showWarning$.next(true);

    this.countdownId = setInterval(() => {
      remaining--;
      this.remainingSeconds$.next(remaining);
      if (remaining <= 0) clearInterval(this.countdownId);
    }, 1000);
  }

  private forceLogout(): void {
    this.stop();
    sessionStorage.clear();
    this.router.navigate(['/login'], { queryParams: { reason: 'timeout' } });
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
