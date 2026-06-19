import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  standalone: true,
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  loading  = false;
  sent     = false;
  errorMsg = '';

  constructor(private fb: FormBuilder, private api: ApiService) {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading  = true;
    this.errorMsg = '';

    this.api.forgotPassword(this.form.getRawValue().email).subscribe({
      next: () => {
        this.loading = false;
        this.sent    = true;
      },
      error: () => {
        this.loading  = false;
        this.errorMsg = 'Something went wrong. Please try again.';
      },
    });
  }
}
