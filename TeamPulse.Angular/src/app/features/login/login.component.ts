import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Observable, of, switchMap, catchError, shareReplay, tap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, IconComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  form = this.fb.nonNullable.group({
    tenantId: ['', Validators.required],
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  error = '';
  loading = false;
  loadingMessage = 'Connecting…';
  timeoutNotice = false;
  showPassword = false;

  private warmUpReady = false;
  private warmUp$!: Observable<unknown>;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
  ) {}

  ngOnInit(): void {
    this.timeoutNotice = this.route.snapshot.queryParamMap.get('reason') === 'timeout';
    this.warmUp$ = this.api.ping().pipe(
      catchError(() => of(null)),
      tap(() => { this.warmUpReady = true; }),
      shareReplay(1),
    );
    this.warmUp$.subscribe();
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.loadingMessage = 'Connecting…';
    this.error = '';
    this.timeoutNotice = false;

    const { tenantId, username, password } = this.form.getRawValue();
    const proceed$ = this.warmUpReady ? of(null) : this.warmUp$;
    proceed$.pipe(
      tap(() => { this.loadingMessage = 'Signing in…'; }),
      switchMap(() => this.auth.login({ tenantId, username, password })),
    ).subscribe({
      next: (res) => {
        const dest = res.role === 'platform-admin' ? '/platform-admin' : '/dashboard';
        this.router.navigate([dest]);
      },
      error: () => {
        this.error = 'Invalid company code, username, or password';
        this.loading = false;
      },
    });
  }
}
