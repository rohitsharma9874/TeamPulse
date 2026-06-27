import { Injectable, OnDestroy } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { AppNotification } from '../models/notification.model';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  notifications: AppNotification[] = [];
  private pollSub?: Subscription;

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  constructor(private api: ApiService, private auth: AuthService) {}

  start(): void {
    this.fetch();
    this.pollSub = interval(30_000).subscribe(() => {
      if (this.auth.isLoggedIn) this.fetch();
    });
  }

  stop(): void {
    this.pollSub?.unsubscribe();
    this.notifications = [];
  }

  markRead(id: string): void {
    const n = this.notifications.find(x => x.id === id);
    if (n) n.isRead = true;
    this.api.markNotificationRead(id).subscribe({ error: () => { if (n) n.isRead = false; } });
  }

  markAllRead(): void {
    this.notifications.forEach(n => n.isRead = true);
    this.api.markAllNotificationsRead().subscribe({ error: () => this.fetch() });
  }

  private fetch(): void {
    this.api.getNotifications().subscribe({
      next: notifs => { this.notifications = notifs; },
      error: () => {},
    });
  }

  ngOnDestroy(): void { this.stop(); }
}
