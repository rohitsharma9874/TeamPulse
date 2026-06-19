import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _dark = false;

  get isDark(): boolean { return this._dark; }

  init(): void {
    const saved = localStorage.getItem('tp_theme');
    if (saved === 'dark') this.apply(true);
  }

  toggle(): void { this.apply(!this._dark); }

  private apply(dark: boolean): void {
    this._dark = dark;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('tp_theme', dark ? 'dark' : 'light');
  }
}
