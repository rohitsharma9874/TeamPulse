import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User, ROLE_LABELS } from '../../../../core/models/user.model';
import { MemberDocument } from '../../../../core/models/member-document.model';
import { ApiService } from '../../../../core/services/api.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

type DetailTab = 'profile' | 'address' | 'emergency' | 'documents';

@Component({
  standalone: true,
  selector: 'app-member-detail-modal',
  imports: [CommonModule, IconComponent],
  templateUrl: './member-detail-modal.component.html',
  styleUrls: ['./member-detail-modal.component.scss'],
})
export class MemberDetailModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() member: User | null = null;
  @Input() allUsers: User[] = [];
  @Input() canEdit = false;

  @Output() close    = new EventEmitter<void>();
  @Output() editUser = new EventEmitter<User>();

  activeTab: DetailTab = 'profile';
  docs: MemberDocument[] = [];
  loadingDocs = false;

  readonly tabs: { key: DetailTab; label: string }[] = [
    { key: 'profile',   label: 'Profile'   },
    { key: 'address',   label: 'Address'   },
    { key: 'emergency', label: 'Emergency' },
    { key: 'documents', label: 'Documents' },
  ];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnChanges(): void {
    if (this.visible && this.member) {
      this.activeTab = 'profile';
      this.docs = [];
      this.loadDocs();
    }
  }

  private loadDocs(): void {
    if (!this.member?.id) return;
    this.loadingDocs = true;
    this.api.getMemberDocuments(this.member.id).subscribe({
      next: docs => { this.docs = docs; this.loadingDocs = false; this.cdr.detectChanges(); },
      error: ()  => { this.loadingDocs = false; this.cdr.detectChanges(); },
    });
  }

  getManagerName(): string {
    if (!this.member?.reportsTo) return '—';
    return this.allUsers.find(u => u.id === this.member!.reportsTo)?.name ?? '—';
  }

  getRoleLabel(role: string): string { return ROLE_LABELS[role] ?? role; }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
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
    if (ct.startsWith('image/'))                             return '🖼️';
    if (ct === 'application/pdf')                            return '📄';
    if (ct.includes('spreadsheet') || ct.includes('excel')) return '📊';
    if (ct.includes('word'))                                 return '📝';
    if (ct.includes('zip') || ct.includes('rar'))           return '🗜️';
    return '📎';
  }

  formatAddress(u: User): string {
    return [u.addressLine1, u.city, u.state, u.pinCode, u.country].filter(v => !!v).join(', ');
  }

  docTypeColor(type: string): string {
    const map: Record<string, string> = {
      'Aadhar Card': '#3b82f6', 'PAN Card': '#f59e0b', 'Passport': '#8b5cf6',
      'Voter ID': '#10b981', 'Driving Licence': '#ec4899', 'Address Proof': '#06b6d4',
      'Qualification Certificate': '#6366f1', 'Experience Letter': '#f97316',
    };
    return map[type] ?? '#9ca3af';
  }
}
