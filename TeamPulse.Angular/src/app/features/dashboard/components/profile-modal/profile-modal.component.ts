import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UpdateProfileRequest, User } from '../../../../core/models/user.model';
import { DatePickerComponent } from '../../../../shared/components/date-picker/date-picker.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

type ProfileTab = 'personal' | 'address' | 'emergency' | 'security';

@Component({
  standalone: true,
  selector: 'app-profile-modal',
  imports: [CommonModule, ReactiveFormsModule, DatePickerComponent, IconComponent],
  templateUrl: './profile-modal.component.html',
  styleUrls: ['./profile-modal.component.scss'],
})
export class ProfileModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() user: User | null = null;
  @Input() saving = false;

  @Output() save   = new EventEmitter<UpdateProfileRequest>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  activeTab: ProfileTab = 'personal';
  showPassword = false;

  readonly tabs: { key: ProfileTab; label: string; icon: string }[] = [
    { key: 'personal',  label: 'Personal',  icon: 'user'     },
    { key: 'address',   label: 'Address',   icon: 'map-pin'  },
    { key: 'emergency', label: 'Emergency', icon: 'shield'   },
    { key: 'security',  label: 'Security',  icon: 'lock'     },
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      // Personal
      name:             ['', Validators.required],
      email:            ['', [Validators.required, Validators.email]],
      phone:            ['', Validators.pattern(/^[0-9+\s\-()]{7,15}$/)],
      gender:           [''],
      dateOfBirth:      [''],
      // Address
      addressLine1:     [''],
      city:             [''],
      state:            [''],
      pinCode:          [''],
      country:          [''],
      // Emergency
      emergencyContact: [''],
      emergencyPhone:   [''],
      // Security
      newPassword:      ['', Validators.minLength(6)],
    });
  }

  ngOnChanges(): void {
    if (!this.visible) return;
    this.activeTab   = 'personal';
    this.showPassword = false;

    if (this.user) {
      this.form.reset();
      this.form.patchValue({
        name:             this.user.name,
        email:            this.user.email,
        phone:            this.user.phone            ?? '',
        gender:           this.user.gender           ?? '',
        dateOfBirth:      this.user.dateOfBirth      ? this.user.dateOfBirth.split('T')[0] : '',
        addressLine1:     this.user.addressLine1     ?? '',
        city:             this.user.city             ?? '',
        state:            this.user.state            ?? '',
        pinCode:          this.user.pinCode          ?? '',
        country:          this.user.country          ?? '',
        emergencyContact: this.user.emergencyContact ?? '',
        emergencyPhone:   this.user.emergencyPhone   ?? '',
        newPassword:      '',
      });
    }
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const request: UpdateProfileRequest = {
      name:             v.name?.trim()             || undefined,
      email:            v.email?.trim()            || undefined,
      phone:            v.phone?.trim()            || undefined,
      gender:           v.gender                  || undefined,
      dateOfBirth:      v.dateOfBirth             || undefined,
      addressLine1:     v.addressLine1?.trim()     || undefined,
      city:             v.city?.trim()             || undefined,
      state:            v.state?.trim()            || undefined,
      pinCode:          v.pinCode?.trim()          || undefined,
      country:          v.country?.trim()          || undefined,
      emergencyContact: v.emergencyContact?.trim() || undefined,
      emergencyPhone:   v.emergencyPhone?.trim()   || undefined,
    };
    if (v.newPassword?.trim()) {
      request.newPassword = v.newPassword.trim();
    }
    this.save.emit(request);
  }
}
