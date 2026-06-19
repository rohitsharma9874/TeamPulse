import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../../../core/models/task.model';
import { User } from '../../../../core/models/user.model';

export type KanbanStatus =
  | 'new'
  | 'refinement'
  | 'ready'
  | 'in-progress'
  | 'review'
  | 'complete';

interface Column {
  status: KanbanStatus;
  label: string;
  accent: string;
  icon: string;
}

// Backward compatibility map for old stage names
const STATUS_COMPAT: Record<string, KanbanStatus> = {
  pending:                 'new',
  open:                    'new',
  'requirement-gathering': 'refinement',
  'awaiting-client':       'ready',
  'under-review':          'review',
  completed:               'complete',
};

const normalise = (s: string): KanbanStatus =>
  (STATUS_COMPAT[s] ?? s) as KanbanStatus;

@Component({
  standalone: true,
  selector: 'app-kanban',
  imports: [CommonModule],
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.scss'],
})
export class KanbanComponent {
  @Input() tasks: Task[] = [];
  @Input() users: User[] = [];
  @Input() canEdit = true;
  @Input() canDelete = true;
  /** When non-null, only these statuses are shown as columns. Null = show all. */
  @Input() visibleStatuses: KanbanStatus[] | null = null;

  @Output() editTask    = new EventEmitter<Task>();
  @Output() deleteTask  = new EventEmitter<string>();
  @Output() moveTask    = new EventEmitter<{ taskId: string; status: KanbanStatus }>();
  @Output() addToColumn = new EventEmitter<KanbanStatus>();

  private readonly allColumns: Column[] = [
    { status: 'new',        label: 'New',        accent: '#6b7280', icon: '📥' },
    { status: 'refinement', label: 'Refinement', accent: '#8b5cf6', icon: '🔬' },
    { status: 'ready',      label: 'Ready',      accent: '#3b82f6', icon: '✅' },
    { status: 'in-progress',label: 'In Progress',accent: '#f59e0b', icon: '⚡' },
    { status: 'review',     label: 'Review',     accent: '#ec4899', icon: '🔍' },
    { status: 'complete',   label: 'Complete',   accent: '#10b981', icon: '🏁' },
  ];

  get columns(): Column[] {
    if (!this.visibleStatuses) return this.allColumns;
    return this.allColumns.filter(c => this.visibleStatuses!.includes(c.status));
  }

  draggingId: string | null = null;
  dragOverStatus: KanbanStatus | null = null;

  getColumnTasks(status: KanbanStatus): Task[] {
    return this.tasks.filter(t => normalise(t.status) === status);
  }

  getUserName(userId: string): string {
    return this.users.find(u => u.id === userId)?.name ?? '—';
  }

  getUserPhoto(userId: string): string {
    return this.users.find(u => u.id === userId)?.photo
      ?? `https://ui-avatars.com/api/?name=?&background=1B3A6B&color=fff`;
  }

  isOverdue(task: Task): boolean {
    return !!(task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed');
  }

  // ── Drag & Drop ──────────────────────────────────────────
  onDragStart(event: DragEvent, taskId: string): void {
    this.draggingId = taskId;
    event.dataTransfer?.setData('text/plain', taskId);
    (event.target as HTMLElement).classList.add('dragging');
  }

  onDragEnd(event: DragEvent): void {
    this.draggingId = null;
    this.dragOverStatus = null;
    (event.target as HTMLElement).classList.remove('dragging');
  }

  onDragOver(event: DragEvent, status: KanbanStatus): void {
    event.preventDefault();
    this.dragOverStatus = status;
  }

  onDragLeave(): void { this.dragOverStatus = null; }

  onDrop(event: DragEvent, status: KanbanStatus): void {
    event.preventDefault();
    const taskId = event.dataTransfer?.getData('text/plain') ?? this.draggingId;
    this.dragOverStatus = null;
    this.draggingId = null;
    if (!taskId) return;
    const task = this.tasks.find(t => t.id === taskId);
    if (task && normalise(task.status) !== status) {
      this.moveTask.emit({ taskId, status });
    }
  }
}
