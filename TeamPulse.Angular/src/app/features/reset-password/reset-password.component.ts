import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const pass    = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return pass && confirm && pass !== confirm ? { mismatch: true } : null;
}

@Component({
  standalone: true,
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  form = this.fb.nonNullable.group(
    {
      newPassword:     ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch }
  );

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
