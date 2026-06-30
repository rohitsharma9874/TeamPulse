import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService, TenantRow, CreateTenantRequest } from '../../core/services/api.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  standalone: true,
  selector: 'app-platform-admin',
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './platform-admin.component.html',
  styleUrls: ['./platform-admin.component.scss'],
})
export class PlatformAdminComponent implements OnInit {
  tenants: TenantRow[] = [];
  loading = true;
  showForm = false;
  saving = false;
  error = '';
  editingTenant: TenantRow | null = null;

  createForm = this.fb.nonNullable.group({
    id:            ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{3,10}$/)]],
    name:          ['', Validators.required],
    tagline:       ['', Validators.required],
    adminUsername: ['', Validators.required],
    adminName:     ['', Validators.required],
    adminEmail:    ['', [Validators.required, Validators.email]],
    adminPassword: [''],
  });

  editForm = this.fb.nonNullable.group({
    name:    ['', Validators.required],
    tagline: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    public auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadTenants();
  }

  loadTenants(): void {
    this.loading = true;
    this.api.getTenants().subscribe({
      next: t => { this.tenants = t; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  openCreate(): void {
    this.editingTenant = null;
    this.createForm.reset();
    this.error = '';
    this.showForm = true;
  }

  openEdit(tenant: TenantRow): void {
    this.editingTenant = tenant;
    this.editForm.patchValue({ name: tenant.name, tagline: tenant.tagline });
    this.error = '';
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingTenant = null;
    this.error = '';
  }

  saveCreate(): void {
    if (this.createForm.invalid) return;
    this.saving = true;
    this.error = '';
    const v = this.createForm.getRawValue();
    const req: CreateTenantRequest = {
      id:            v.id.toUpperCase(),
      name:          v.name,
      tagline:       v.tagline,
      logoUrl:       null,
      adminUsername: v.adminUsername,
      adminName:     v.adminName,
      adminEmail:    v.adminEmail,
      adminPassword: v.adminPassword || undefined,
    };
    this.api.createTenant(req).subscribe({
      next: tenant => {
        this.tenants = [...this.tenants, { ...tenant, userCount: 1 }];
        this.saving = false;
        this.closeForm();
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Failed to create tenant.';
        this.saving = false;
      },
    });
  }

  saveEdit(): void {
    if (this.editForm.invalid || !this.editingTenant) return;
    this.saving = true;
    this.error = '';
    const v = this.editForm.getRawValue();
    this.api.updateTenant(this.editingTenant.id, { name: v.name, tagline: v.tagline, logoUrl: null }).subscribe({
      next: updated => {
        this.tenants = this.tenants.map(t => t.id === updated.id ? { ...t, ...updated } : t);
        this.saving = false;
        this.closeForm();
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Failed to update tenant.';
        this.saving = false;
      },
    });
  }

  toggle(tenant: TenantRow): void {
    this.api.toggleTenant(tenant.id).subscribe({
      next: res => {
        this.tenants = this.tenants.map(t => t.id === res.id ? { ...t, isActive: res.isActive } : t);
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
