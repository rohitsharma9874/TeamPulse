import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const pass    = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return pass && confirm && pass !== confirm ? { mismatch: true } : null;
}

function passwordStrength(control: AbstractControl): ValidationErrors | null {
  const val = (control.value as string) ?? '';
  const errors: ValidationErrors = {};
  if (val.length < 8)       errors['minLength'] = true;
  if (!/[A-Z]/.test(val))   errors['uppercase'] = true;
  if (!/[a-z]/.test(val))   errors['lowercase'] = true;
  if (!/[0-9]/.test(val))   errors['number']    = true;
  return Object.keys(errors).length ? errors : null;
}

@Component({
  standalone: true,
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, IconComponent],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  form = this.fb.nonNullable.group(
    {
      newPassword:     ['', [Validators.required, passwordStrength]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch }
  );

  get pw(): string        { return this.form.get('newPassword')?.value ?? ''; }
  get hasMin(): boolean   { return this.pw.length >= 8; }
  get hasUpper(): boolean { return /[A-Z]/.test(this.pw); }
  get hasLower(): boolean { return /[a-z]/.test(this.pw); }
  get hasNum(): boolean   { return /[0-9]/.test(this.pw); }

  token    = '';
  loading  = false;
  done     = false;
  errorMsg = '';
  showNew  = false;
  showConf = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private api: ApiService,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  submit(): void {
    if (this.form.invalid || !this.token) return;
    this.loading  = true;
    this.errorMsg = '';

    this.api.resetPassword(this.token, this.form.getRawValue().newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.done    = true;
      },
      error: (err) => {
        this.loading  = false;
        this.errorMsg = err?.error?.message ?? 'This reset link is invalid or has expired.';
      },
    });
  }
}
