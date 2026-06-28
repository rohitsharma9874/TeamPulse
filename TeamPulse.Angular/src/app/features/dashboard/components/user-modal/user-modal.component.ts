import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  User, CreateUserRequest, UpdateProfileRequest,
  ROLE_GROUPS, ROLE_HIERARCHY, RoleGroup, ROLE_LABELS,
  DEPARTMENTS, DESIGNATIONS,
} from '../../../../core/models/user.model';
import { MemberDocument, DOCUMENT_TYPES } from '../../../../core/models/member-document.model';
import { ApiService } from '../../../../core/services/api.service';
import { DatePickerComponent } from '../../../../shared/components/date-picker/date-picker.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

export interface UserSavePayload {
  request: CreateUserRequest | UpdateProfileRequest;
  isEdit: boolean;
  userId?: string;
}

type ModalTab = 'account' | 'work' | 'address' | 'emergency' | 'documents';

@Component({
  standalone: true,
  selector: 'app-user-modal',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePickerComponent, IconComponent],
  templateUrl: './user-modal.component.html',
  styleUrls: ['./user-modal.component.scss'],
})
export class UserModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() editingUser: User | null = null;   // null = add mode
  @Input() allUsers: User[] = [];             // for Reports-To dropdown
  @Input() currentUserRole = '';
  @Input() saving = false;

  @Output() save   = new EventEmitter<UserSavePayload>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  docError = false;
  activeTab: ModalTab = 'account';

  // Member documents (edit mode)
  existingDocs: MemberDocument[] = [];
  pendingFiles: { file: File; docType: string }[] = [];
  loadingDocs = false;
  isDragOver = false;
  pendingDocType = 'Other';

  readonly tabs: { key: ModalTab; label: string; icon: string }[] = [
    { key: 'account',   label: 'Account',   icon: 'user'       },
    { key: 'work',      label: 'Work',       icon: 'briefcase'  },
    { key: 'address',   label: 'Address',    icon: 'map-pin'    },
    { key: 'emergency', label: 'Emergency',  icon: 'shield'     },
    { key: 'documents', label: 'Documents',  icon: 'paperclip'  },
  ];

  readonly documentTypes  = DOCUMENT_TYPES;
  readonly departments    = DEPARTMENTS;
  readonly designations   = DESIGNATIONS;

  get isEdit(): boolean { return !!this.editingUser; }
  get modalTitle(): string { return this.isEdit ? 'Edit Member' : 'Add Team Member'; }

  constructor(private fb: FormBuilder, private api: ApiService, private cdr: ChangeDetectorRef) {
    this.buildForm();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      // Account
      username:   ['', [Validators.required, Validators.minLength(3)]],
      name:       ['', Validators.required],
      email:      ['', [Validators.required, Validators.email]],
      // Work
      role:        ['trainee', Validators.required],
      department:  ['', Validators.required],
      designation: ['', Validators.required],
      reportsTo:   [''],
      joinDate:    ['', Validators.required],
      // Contact & Address
      phone:       ['', [Validators.required, Validators.pattern(/^[0-9+\s\-()]{7,15}$/)]],
      addressLine1:[''],
      city:        [''],
      state:       [''],
      pinCode:     [''],
      country:     [''],
      // Personal
      gender:      [''],
      dateOfBirth: [''],
      // Emergency (required)
      emergencyContact: ['', Validators.required],
      emergencyPhone:   ['', [Validators.required, Validators.pattern(/^[0-9+\s\-()]{7,15}$/)]],
      // Password change (edit mode only)
      newPassword: [''],
    });
  }

  ngOnChanges(): void {
    if (!this.visible) return;
    this.activeTab = 'account';
    this.pendingFiles = [];
    this.existingDocs = [];
    this.docError = false;

    if (this.isEdit && this.editingUser) {
      const u = this.editingUser;
      this.form.get('username')?.disable();
      this.form.patchValue({
        username:         u.username,
        name:             u.name,
        email:            u.email,
        role:             u.role,
        department:       u.department ?? '',
        designation:      u.designation ?? '',
        reportsTo:        u.reportsTo ?? '',
        joinDate:         u.joinDate ? u.joinDate.split('T')[0] : '',
        phone:            u.phone ?? '',
        addressLine1:     u.addressLine1 ?? '',
        city:             u.city ?? '',
        state:            u.state ?? '',
        pinCode:          u.pinCode ?? '',
        country:          u.country ?? '',
        gender:           u.gender ?? '',
        dateOfBirth:      u.dateOfBirth ? u.dateOfBirth.split('T')[0] : '',
        emergencyContact: u.emergencyContact ?? '',
        emergencyPhone:   u.emergencyPhone ?? '',
        newPassword:      '',
        password:         '',
      });
      this.loadDocs();
    } else {
      this.form.get('username')?.enable();
      this.form.reset({ role: 'trainee' });
    }
  }

  private loadDocs(): void {
    if (!this.editingUser?.id) return;
    this.loadingDocs = true;
    this.api.getMemberDocuments(this.editingUser.id).subscribe({
      next: docs => { this.existingDocs = docs; this.loadingDocs = false; this.cdr.detectChanges(); },
      error: ()  => { this.loadingDocs = false; this.cdr.detectChanges(); },
    });
  }

  get assignableRoleGroups(): RoleGroup[] {
    const myRank = ROLE_HIERARCHY[this.currentUserRole] ?? 9;
    return ROLE_GROUPS.map(g => ({
      ...g,
      roles: g.roles.filter(r => (ROLE_HIERARCHY[r.value] ?? 9) >= myRank),
    })).filter(g => g.roles.length > 0);
  }

  // Possible managers: users with higher rank than current role selection
  get reportableUsers(): User[] {
    const selectedRole = this.form.get('role')?.value ?? '';
    const myRank = ROLE_HIERARCHY[selectedRole] ?? 9;
    return this.allUsers
      .filter(u => (ROLE_HIERARCHY[u.role] ?? 9) < myRank && u.id !== this.editingUser?.id)
      .sort((a, b) => (ROLE_HIERARCHY[a.role] ?? 9) - (ROLE_HIERARCHY[b.role] ?? 9));
  }

  getRoleLabel(role: string): string { return ROLE_LABELS[role] ?? role; }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  // ── Documents ─────────────────────────────────────────────
  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragOver = true; }
  onDragLeave(): void { this.isDragOver = false; }
  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver = false;
    this.addFiles(Array.from(e.dataTransfer?.files ?? []));
  }

  onFileChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.addFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  private addFiles(files: File[]): void {
    const existing = new Set(this.pendingFiles.map(p => p.file.name));
    files.filter(f => !existing.has(f.name))
         .forEach(f => this.pendingFiles.push({ file: f, docType: this.pendingDocType }));
  }

  removePending(item: { file: File; docType: string }): void {
    this.pendingFiles = this.pendingFiles.filter(p => p !== item);
  }

  deleteExistingDoc(doc: MemberDocument): void {
    this.api.deleteMemberDocument(doc.id).subscribe({
      next: () => { this.existingDocs = this.existingDocs.filter(d => d.id !== doc.id); this.cdr.detectChanges(); },
    });
  }

  downloadDoc(doc: MemberDocument): void {
    this.api.downloadMemberDocument(doc.id).subscribe(blob => {
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = doc.originalName; link.click();
      URL.revokeObjectURL(url);
    });
  }

  viewDoc(doc: MemberDocument): void {
    const viewable = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    this.api.downloadMemberDocument(doc.id).subscribe(blob => {
      const url = URL.createObjectURL(new Blob([blob], { type: doc.contentType }));
      if (viewable.includes(doc.contentType)) {
        window.open(url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = url; link.download = doc.originalName; link.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024)      return `${bytes} B`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }

  fileIcon(ct: string): string {
    if (ct.startsWith('image/'))                              return '🖼️';
    if (ct === 'application/pdf')                             return '📄';
    if (ct.includes('spreadsheet') || ct.includes('excel'))  return '📊';
    if (ct.includes('word'))                                  return '📝';
    if (ct.includes('zip') || ct.includes('rar'))            return '🗜️';
    return '📎';
  }

  // ── Submit ────────────────────────────────────────────────
  submit(): void {
    this.form.markAllAsTouched();
    // Require at least one document for new members
    const hasDoc = this.isEdit
      ? (this.existingDocs.length > 0 || this.pendingFiles.length > 0)
      : this.pendingFiles.length > 0;
    if (!hasDoc) {
      this.docError = true;
      this.activeTab = 'documents';
    }
    if (this.form.invalid || !hasDoc) return;
    this.docError = false;
    const v = this.form.getRawValue();

    if (this.isEdit) {
      const req: UpdateProfileRequest = {
        name:             v.name?.trim()             || undefined,
        email:            v.email?.trim()            || undefined,
        department:       v.department?.trim()       || undefined,
        phone:            v.phone?.trim()            || undefined,
        newPassword:      v.newPassword?.trim()      || undefined,
        reportsTo:        v.reportsTo               || undefined,
        designation:      v.designation?.trim()      || undefined,
        gender:           v.gender                  || undefined,
        dateOfBirth:      v.dateOfBirth             || undefined,
        joinDate:         v.joinDate                || undefined,
        addressLine1:     v.addressLine1?.trim()     || undefined,
        city:             v.city?.trim()             || undefined,
        state:            v.state?.trim()            || undefined,
        pinCode:          v.pinCode?.trim()          || undefined,
        country:          v.country?.trim()          || undefined,
        emergencyContact: v.emergencyContact?.trim() || undefined,
        emergencyPhone:   v.emergencyPhone?.trim()   || undefined,
      };
      this.save.emit({ request: req, isEdit: true, userId: this.editingUser!.id, files: this.pendingFiles } as any);
    } else {
      const req: CreateUserRequest = {
        username:         v.username.trim(),
        name:             v.name.trim(),
        email:            v.email.trim(),
        role:             v.role,
        department:       v.department?.trim()       || undefined,
        phone:            v.phone?.trim()            || undefined,
        reportsTo:        v.reportsTo               || undefined,
        designation:      v.designation?.trim()      || undefined,
        gender:           v.gender                  || undefined,
        dateOfBirth:      v.dateOfBirth             || undefined,
        joinDate:         v.joinDate                || undefined,
        addressLine1:     v.addressLine1?.trim()     || undefined,
        city:             v.city?.trim()             || undefined,
        state:            v.state?.trim()            || undefined,
        pinCode:          v.pinCode?.trim()          || undefined,
        country:          v.country?.trim()          || undefined,
        emergencyContact: v.emergencyContact?.trim() || undefined,
        emergencyPhone:   v.emergencyPhone?.trim()   || undefined,
      };
      this.save.emit({ request: req, isEdit: false, files: this.pendingFiles } as any);
    }
  }
}
