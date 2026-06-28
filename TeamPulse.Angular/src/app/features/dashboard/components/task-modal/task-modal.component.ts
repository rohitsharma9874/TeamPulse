import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePickerComponent } from '../../../../shared/components/date-picker/date-picker.component';
import { Task, TaskRequest } from '../../../../core/models/task.model';
import { TaskDocument } from '../../../../core/models/task-document.model';
import { PaymentTransaction, PAYMENT_METHODS } from '../../../../core/models/payment-transaction.model';
import { User, ROLE_HIERARCHY } from '../../../../core/models/user.model';
import { ApiService } from '../../../../core/services/api.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

export interface TaskSavePayload {
  request: TaskRequest;
  files: File[];
}

@Component({
  standalone: true,
  selector: 'app-task-modal',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DatePickerComponent, IconComponent],
  templateUrl: './task-modal.component.html',
  styleUrls: ['./task-modal.component.scss'],
})
export class TaskModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() task: Task | null = null;
  @Input() users: User[] = [];
  @Input() currentUserRole = '';
  @Input() saving = false;
  /** Pre-fill the deadline for new tasks (YYYY-MM-DD) */
  @Input() defaultDeadline = '';

  @Output() save   = new EventEmitter<TaskSavePayload>();
  @Output() cancel = new EventEmitter<void>();

  form = this.fb.group({
    title:         ['', Validators.required],
    description:   ['', Validators.required],
    assignee:      ['', Validators.required],
    priority:      ['Medium', Validators.required],
    status:        ['new', Validators.required],
    deadline:      [''],
    clientContact: [''],
    billing:       [''],
    paymentStatus: ['N/A'],
    remarks:       [''],
  });

  readonly priorities = ['Low', 'Medium', 'High', 'Urgent'];
  readonly statuses   = [
    { value: 'new',         label: 'New'        },
    { value: 'refinement',  label: 'Refinement' },
    { value: 'ready',       label: 'Ready'      },
    { value: 'in-progress', label: 'In Progress'},
    { value: 'review',      label: 'Review'     },
    { value: 'complete',    label: 'Complete'   },
  ];
  readonly payments = ['N/A', 'Pending', 'Partly Paid', 'Paid'];

  /** Minimum date for deadline = today (prevents past date selection) */
  get todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Attachments
  existingDocs: TaskDocument[] = [];
  pendingFiles: File[]         = [];
  loadingDocs  = false;
  isDragOver   = false;

  // Payment history
  paymentHistory: PaymentTransaction[] = [];
  loadingPayments = false;
  showAddPayment  = false;
  newPaymentAmount = '';
  newPaymentMethod = 'Bank Transfer';
  newPaymentNotes  = '';
  newPaymentDate   = '';
  savingPayment    = false;
  readonly paymentMethods = PAYMENT_METHODS;

  get isEdit(): boolean { return !!this.task; }

  get assignableUsers(): User[] {
    const myRank = ROLE_HIERARCHY[this.currentUserRole] ?? 99;
    if (myRank <= 2) return this.users;
    return this.users.filter(u => (ROLE_HIERARCHY[u.role] ?? 99) >= myRank);
  }

  constructor(private fb: FormBuilder, private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnChanges(): void {
    if (!this.visible) return;
    this.pendingFiles   = [];
    this.existingDocs   = [];
    this.paymentHistory = [];
    this.showAddPayment = false;

    if (this.task) {
      this.form.patchValue({
        title:         this.task.title,
        description:   this.task.description,
        assignee:      this.task.assignee,
        priority:      this.task.priority,
        status:        this.task.status,
        deadline:      this.task.deadline ? this.task.deadline.split('T')[0] : '',
        clientContact: this.task.clientContact ?? '',
        billing:       this.task.billing ?? '',
        paymentStatus: this.task.paymentStatus ?? 'N/A',
        remarks:       this.task.remarks ?? '',
      });
      this.loadDocs();
      this.loadPayments();
    } else {
      this.form.reset({ priority: 'Medium', status: 'new', paymentStatus: 'N/A', deadline: this.defaultDeadline });
    }
  }

  private loadDocs(): void {
    if (!this.task?.id) return;
    this.loadingDocs = true;
    this.api.getAttachments(this.task.id).subscribe({
      next: docs => { this.existingDocs = docs; this.loadingDocs = false; this.cdr.detectChanges(); },
      error: ()  => { this.loadingDocs = false; this.cdr.detectChanges(); },
    });
  }

  // ── File picking ──────────────────────────────────────────
  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); this.isDragOver = true; }
  onDragLeave(): void { this.isDragOver = false; }
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    this.addFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  private addFiles(files: File[]): void {
    const existing = new Set(this.pendingFiles.map(f => f.name));
    files.filter(f => !existing.has(f.name)).forEach(f => this.pendingFiles.push(f));
  }

  removePending(file: File): void {
    this.pendingFiles = this.pendingFiles.filter(f => f !== file);
  }

  deleteExisting(doc: TaskDocument): void {
    this.api.deleteAttachment(doc.id).subscribe({
      next: () => { this.existingDocs = this.existingDocs.filter(d => d.id !== doc.id); this.cdr.detectChanges(); },
    });
  }

  downloadDoc(doc: TaskDocument): void {
    this.api.downloadAttachment(doc.id).subscribe(blob => {
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = doc.originalName;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1_048_576)   return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }

  fileIcon(contentType: string): string {
    if (contentType.startsWith('image/'))                               return '🖼️';
    if (contentType === 'application/pdf')                              return '📄';
    if (contentType.includes('spreadsheet') || contentType.includes('excel')) return '📊';
    if (contentType.includes('word'))                                   return '📝';
    if (contentType.includes('zip') || contentType.includes('rar'))     return '🗜️';
    return '📎';
  }

  // ── Payment history ───────────────────────────────────────
  private loadPayments(): void {
    if (!this.task?.id) return;
    this.loadingPayments = true;
    this.api.getPaymentTransactions(this.task.id).subscribe({
      next: txns => { this.paymentHistory = txns; this.loadingPayments = false; this.cdr.detectChanges(); },
      error: ()   => { this.loadingPayments = false; this.cdr.detectChanges(); },
    });
  }

  totalPaid(): number { return this.paymentHistory.reduce((s, t) => s + t.amount, 0); }

  addPayment(): void {
    const amount = parseFloat(this.newPaymentAmount);
    if (!amount || amount <= 0 || !this.task?.id) return;
    this.savingPayment = true;
    this.api.createPaymentTransaction(this.task.id, {
      amount,
      paymentMethod: this.newPaymentMethod,
      notes:  this.newPaymentNotes,
      paidOn: this.newPaymentDate || undefined,
    }).subscribe({
      next: txn => {
        this.paymentHistory = [txn, ...this.paymentHistory];
        // Reflect new paymentStatus on form
        const total = this.totalPaid();
        const billing = parseFloat(String(this.form.value.billing ?? '').replace(/[^\d.]/g, ''));
        const status = total <= 0 ? 'Pending'
          : (billing > 0 && total >= billing ? 'Paid' : 'Partly Paid');
        this.form.patchValue({ paymentStatus: status });
        this.newPaymentAmount = '';
        this.newPaymentNotes  = '';
        this.newPaymentDate   = '';
        this.showAddPayment   = false;
        this.savingPayment    = false;
        this.cdr.detectChanges();
      },
      error: () => { this.savingPayment = false; this.cdr.detectChanges(); },
    });
  }

  deletePayment(txn: PaymentTransaction): void {
    this.api.deletePaymentTransaction(txn.id).subscribe({
      next: () => { this.paymentHistory = this.paymentHistory.filter(t => t.id !== txn.id); this.cdr.detectChanges(); },
    });
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ── Submit ────────────────────────────────────────────────
  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;
    const request: TaskRequest = {
      title:         v.title         ?? undefined,
      description:   v.description   ?? undefined,
      assignee:      v.assignee      ?? undefined,
      priority:      v.priority      ?? undefined,
      status:        v.status        ?? undefined,
      deadline:      v.deadline      || undefined,
      clientContact: v.clientContact || undefined,
      billing:       v.billing       || undefined,
      paymentStatus: v.paymentStatus ?? undefined,
      remarks:       v.remarks       || undefined,
    };
    this.save.emit({ request, files: [...this.pendingFiles] });
  }

  close(): void { this.cancel.emit(); }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }
}
