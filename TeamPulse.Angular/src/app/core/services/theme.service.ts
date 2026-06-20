import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _dark = false;
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  get isDark(): boolean { return this._dark; }

  init(): void {
    if (!this.isBrowser) return;
    const saved = localStorage.getItem('tp_theme');
    if (saved === 'dark') this.apply(true);
  }

  toggle(): void { this.apply(!this._dark); }

  private apply(dark: boolean): void {
    this._dark = dark;
    if (!this.isBrowser) return;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('tp_theme', dark ? 'dark' : 'light');
  }
}
