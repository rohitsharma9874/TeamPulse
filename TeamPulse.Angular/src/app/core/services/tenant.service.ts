import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TenantConfig {
  tenantId: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
}

const DEFAULT_CONFIG: TenantConfig = {
  tenantId: '',
  name: 'TeamPulse',
  tagline: 'Workforce Intelligence',
  logoUrl: null,
};

@Injectable({ providedIn: 'root' })
export class TenantService {
  private _config: TenantConfig = { ...DEFAULT_CONFIG };

  constructor(private http: HttpClient) {}

  get config(): TenantConfig { return this._config; }
  get name(): string         { return this._config.name; }
  get tagline(): string      { return this._config.tagline; }

  async loadForTenant(tenantId: string): Promise<void> {
    if (!tenantId) return;
    try {
      const config = await firstValueFrom(
        this.http.get<TenantConfig>(`${environment.apiUrl}/config?tenantId=${encodeURIComponent(tenantId)}`)
      );
      this._config = config;
    } catch {
      // Fall back to defaults if config fetch fails
    }
  }

  reset(): void {
    this._config = { ...DEFAULT_CONFIG };
  }
}
