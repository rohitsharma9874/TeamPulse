import { Component, NgZone, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import Chart from 'chart.js/auto';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ThemeService } from '../../core/services/theme.service';
import { InactivityService } from '../../core/services/inactivity.service';
import { TenantService } from '../../core/services/tenant.service';
import { NotificationService } from '../../core/services/notification.service';
import { AppNotification } from '../../core/models/notification.model';
import { PermissionService, AppPermissions, getRoleTier } from '../../core/services/permission.service';
import { User, CreateUserRequest, UpdateProfileRequest, ROLE_LABELS, ROLE_HIERARCHY } from '../../core/models/user.model';
import { Task, TaskRequest, PRIORITY_ORDER } from '../../core/models/task.model';
import { Activity } from '../../core/models/activity.model';
import { TaskModalComponent, TaskSavePayload } from './components/task-modal/task-modal.component';
import { KanbanComponent, KanbanStatus } from './components/kanban/kanban.component';
import { UserModalComponent, UserSavePayload } from './components/user-modal/user-modal.component';
import { ProfileModalComponent } from './components/profile-modal/profile-modal.component';
import { MemberDetailModalComponent } from './components/member-detail-modal/member-detail-modal.component';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

type NavSection    = 'overview' | 'tasks' | 'team' | 'activity' | 'deadlines' | 'performance' | 'alerts';
type TasksTab      = 'list' | 'board' | 'guide';
type OverviewTab   = 'pulse' | 'workload' | 'finances' | 'urgent';
type PerformanceTab = 'leaderboard' | 'metrics' | 'billing';

interface NavSubItem { tab: string; label: string; icon: string; }
interface NavItem { key: NavSection; label: string; icon: string; badgeKey?: string; subItems?: NavSubItem[]; }
interface NavGroup { label: string; items: NavItem[]; }

interface OrgTier { label: string; rank: number; members: User[]; }

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, TaskModalComponent, KanbanComponent, UserModalComponent, ProfileModalComponent, MemberDetailModalComponent, DatePickerComponent, IconComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser = this.auth.currentUser;
  activeSection: NavSection = 'overview';

  users: User[] = [];
  tasks: Task[] = [];
  activities: Activity[] = [];
  loading = true;

  // Permissions — plain property, updated in recompute() to avoid getter re-evaluation every CD cycle
  perms: AppPermissions = this.permService.permsFor(this.currentUser?.role ?? '');

  // Cached task slices — populated in recompute()
  private _visibleTasks:    Task[] = [];
  private _newTasks:        Task[] = [];
  private _refinementTasks: Task[] = [];
  private _readyTasks:      Task[] = [];
  private _inProgressTasks: Task[] = [];
  private _reviewTasks:     Task[] = [];
  private _completedTasks:  Task[] = [];
  private _overdueTasks:    Task[] = [];
  private _topPriorityTasks:  Task[] = [];
  private _upcomingDeadlines: Task[] = [];
  private _upcomingWeekTasks: Task[] = [];
  private _navGroups:         NavGroup[] = [];

  // Cached scalars — populated in recompute()
  private _billedTotal     = 0;
  private _collectedTotal  = 0;
  private _weeklyVelocity  = 0;
  private _teamHealthScore = 100;

  // Task modal
  taskModalVisible = false;
  editingTask: Task | null = null;
  savingTask = false;
  deleteConfirmId: string | null = null;
  private _pendingStatus: KanbanStatus | null = null;

  // User modal (add + edit)
  userModalVisible = false;
  editingUser: User | null = null;
  savingUser = false;
  deleteUserConfirmId: string | null = null;

  // Member detail drawer
  memberDetailVisible = false;
  selectedMember: User | null = null;

  // Team directory view toggle
  teamView: 'grid' | 'hierarchy' = 'grid';
  memberSearch = '';

  // Dashboard overview sub-tabs
  overviewTab: OverviewTab = 'pulse';

  // Tasks section sub-tabs (list / board / workflow-guide)
  tasksTab: TasksTab = 'list';

  // Performance section sub-tabs + filters
  perfTab: PerformanceTab = 'leaderboard';
  perfPeriod: 'month' | 'quarter' | 'all' = 'all';
  perfDept = '';

  // Board filter state
  boardFilterMode: 'month' | 'range' = 'month';
  boardMonth = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; })();
  boardDateFrom = '';
  boardDateTo   = '';
  boardStageFilter: KanbanStatus | null = null;

  // Inactivity warning
  showInactivityWarning = false;
  inactivitySecondsLeft = 300;
  private inactivitySubs: Subscription[] = [];

  // Mobile sidebar toggle
  sidebarOpen = false;

  // Profile modal
  profileModalVisible = false;
  savingProfile = false;

  // Theme
  isDark = false;

  // Task filters
  taskSearch = '';
  taskStatusFilter = '';
  taskPriorityFilter = '';
  taskDateFrom = '';
  taskDateTo = '';

  // Task list pagination
  taskPage = 0;
  readonly taskPageSize = 20;

  // Team directory pagination
  teamPage = 0;
  readonly teamPageSize = 24;

  // Activity pagination
  activityPage = 0;
  readonly activityPageSize = 15;

  // Notification bell
  notifOpen = false;

  // Charts
  private charts = new Map<string, Chart>();
  private clockTimer?: ReturnType<typeof setInterval>;

  // Cached computations — recomputed in recompute() after any data change
  heatmapCells:         { date: string; count: number; level: number }[] = [];
  memberPerfData:       (User & { completed: number; total: number; billed: number; collected: number; completionRate: number; score: number })[] = [];
  cachedCriticalAlerts: string[] = [];
  cachedWarningAlerts:  string[] = [];
  cachedHealthKPIs:     { label: string; value: number; icon: string; color: string }[] = [];
  idleUsersData:        User[] = [];
  orgTiers:             OrgTier[] = [];
  overdueCount  = 0;
  alertsCount   = 0;

  // Cached performance section data — updated only in recomputePerf()
  filteredPerfData: (User & { completed: number; total: number; billed: number; collected: number; completionRate: number; overdue: number; score: number })[] = [];
  perfNoOverdue    = true;
  perfUniqueDepts: string[] = [];

  // O(1) lookup caches — rebuilt in recompute()
  private userNameCache      = new Map<string, string>();
  activeTaskCountCache       = new Map<string, number>();

  readonly pageMeta: Record<NavSection, [string, string]> = {
    overview:    ['Team Dashboard',    'Live summary — work status & team health'],
    performance: ['Team Performance',  'Individual workload, leaderboard & billing stats'],
    tasks:       ['Tasks',             'List view, kanban board & workflow guide'],
    deadlines:   ['Deadline Tracker',  'Overdue & upcoming matters at a glance'],
    alerts:      ['Alerts & Health',   'Issues requiring immediate attention'],
    activity:    ['Activity Log',      'Chronological audit trail of all team actions'],
    team:        ['Team Directory',    'Organisation hierarchy by role'],
  };

  get navGroups(): NavGroup[] { return this._navGroups; }

  private buildNavGroups(): NavGroup[] {
    const p = this.perms;
    const workspaceItems: NavItem[] = [
      { key: 'overview', label: 'Dashboard', icon: 'grid', subItems: [
        { tab: 'pulse',    label: 'Pulse',     icon: 'activity' },
        { tab: 'workload', label: 'Workload',  icon: 'users' },
        ...(p.canViewBilling ? [{ tab: 'finances', label: 'Finances', icon: 'indian-rupee' }] : []),
        { tab: 'urgent',   label: 'Urgent',    icon: 'alert-circle' },
      ]},
      { key: 'tasks', label: 'Tasks', icon: 'check-square', subItems: [
        { tab: 'list',  label: 'List',           icon: 'list' },
        { tab: 'board', label: 'Board',          icon: 'columns' },
        { tab: 'guide', label: 'Workflow Guide', icon: 'book-open' },
      ]},
      { key: 'deadlines', label: 'Deadlines', icon: 'calendar', badgeKey: 'overdue' },
    ];
    const teamItems: NavItem[] = [
      ...(p.canViewTeamDirectory ? [{ key: 'team' as NavSection, label: 'Team Directory', icon: 'users' }] : []),
      ...(p.canViewPerformance   ? [{ key: 'performance' as NavSection, label: 'Performance', icon: 'bar-chart-2', subItems: [
        { tab: 'leaderboard', label: 'Leaderboard',  icon: 'award' },
        { tab: 'metrics',     label: 'Task Metrics', icon: 'trending-up' },
        ...(p.canViewBilling ? [{ tab: 'billing', label: 'Billing', icon: 'credit-card' }] : []),
      ]}] : []),
    ];
    const monitorItems: NavItem[] = [
      ...(p.canViewActivity ? [{ key: 'activity' as NavSection, label: 'Activity Feed', icon: 'scroll' }] : []),
      ...(p.canViewAlerts   ? [{ key: 'alerts'   as NavSection, label: 'Alerts',        icon: 'bell', badgeKey: 'alerts' }] : []),
    ];
    return [
      { label: 'Workspace', items: workspaceItems },
      ...(teamItems.length    > 0 ? [{ label: 'Team',    items: teamItems    }] : []),
      ...(monitorItems.length > 0 ? [{ label: 'Monitor', items: monitorItems }] : []),
    ];
  }

  constructor(
    public auth: AuthService,
    private api: ApiService,
    private router: Router,
    public theme: ThemeService,
    private ngZone: NgZone,
    private permService: PermissionService,
    private inactivity: InactivityService,
    private cdr: ChangeDetectorRef,
    public tenantService: TenantService,
    public notifService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.theme.init();
    this.isDark = this.theme.isDark;
    // Restore last-visited section so page refresh lands where the user left off
    const saved = sessionStorage.getItem('tp_section') as NavSection | null;
    if (saved && saved in this.pageMeta) this.activeSection = saved;
    const savedOvTab = sessionStorage.getItem('tp_overview_tab') as OverviewTab | null;
    if (savedOvTab) this.overviewTab = savedOvTab;
    const savedTab = sessionStorage.getItem('tp_tasks_tab') as TasksTab | null;
    if (savedTab) this.tasksTab = savedTab;
    const savedPerfTab = sessionStorage.getItem('tp_perf_tab') as PerformanceTab | null;
    if (savedPerfTab) this.perfTab = savedPerfTab;
    this.startClock();
    this.loadAll();
    this.notifService.start();
    this.inactivity.start();
    this.inactivitySubs = [
      this.inactivity.showWarning$.subscribe(v => this.showInactivityWarning = v),
      this.inactivity.remainingSeconds$.subscribe(v => this.inactivitySecondsLeft = v),
    ];
  }

  ngOnDestroy(): void {
    clearInterval(this.clockTimer);
    this.destroyAllCharts();
    this.notifService.stop();
    this.inactivity.stop();
    this.inactivitySubs.forEach(s => s.unsubscribe());
  }

  keepAlive(): void {
    this.inactivity.keepAlive();
  }

  get inactivityCountdown(): string {
    const m = Math.floor(this.inactivitySecondsLeft / 60);
    const s = this.inactivitySecondsLeft % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  private startClock(): void {
    this.ngZone.runOutsideAngular(() => {
      const el   = () => document.getElementById('clock-display');
      const tick = () => {
        const node = el();
        if (node) node.textContent = new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
        });
      };
      tick();
      this.clockTimer = setInterval(tick, 1000);
    });
  }

  private loadAll(): void {
    this.loading = true;
    forkJoin({
      users:      this.api.getUsers(),
      tasks:      this.api.getTasks(),
      activities: this.api.getActivities(),
    }).subscribe({
      next: ({ users, tasks, activities }) => {
        this.users      = (users ?? []).filter(u => u.role?.toLowerCase() !== 'owner');
        this.tasks      = tasks      ?? [];
        this.activities = activities ?? [];
        this.loading    = false;
        try {
          this.recompute();
        } catch (e) {
          console.error('[Dashboard] recompute failed:', e);
        }
        this.cdr.detectChanges();
        setTimeout(() => this.renderOverviewCharts(), 100);
      },
      error: (err) => {
        console.error('[Dashboard] load failed:', err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  navigate(section: NavSection): void {
    const prev = this.activeSection;
    // Only destroy charts for the section we're leaving (avoid full teardown on every nav)
    if (prev === 'overview')     { ['donut','line','bar'].forEach(k => { this.charts.get(k)?.destroy(); this.charts.delete(k); }); }
    if (prev === 'performance')  { this.charts.get('dualbar')?.destroy(); this.charts.delete('dualbar'); }
    this.activeSection = section;
    this.notifOpen = false;
    sessionStorage.setItem('tp_section', section);
    if (section === 'overview')                                     setTimeout(() => this.renderOverviewCharts(), 100);
    if (section === 'performance' && this.perfTab === 'billing')    setTimeout(() => this.renderPerformanceChart(), 100);
  }

  setTasksTab(tab: TasksTab): void {
    this.tasksTab = tab;
    sessionStorage.setItem('tp_tasks_tab', tab);
  }

  navigateTasksTab(tab: TasksTab): void {
    this.navigate('tasks');
    this.setTasksTab(tab);
  }

  setOverviewTab(tab: OverviewTab): void {
    this.overviewTab = tab;
    sessionStorage.setItem('tp_overview_tab', tab);
    const chartsNeeded = tab === 'pulse' || tab === 'workload';
    if (chartsNeeded) setTimeout(() => this.renderOverviewCharts(), 100);
  }

  navigateOverviewTab(tab: OverviewTab): void {
    this.navigate('overview');
    this.setOverviewTab(tab);
  }

  navigatePerfTab(tab: PerformanceTab): void {
    this.navigate('performance');
    this.perfTab = tab;
    sessionStorage.setItem('tp_perf_tab', tab);
    if (tab === 'billing') setTimeout(() => this.renderPerformanceChart(), 100);
  }

  setPerfPeriod(period: 'month' | 'quarter' | 'all'): void {
    this.perfPeriod = period;
    this.recomputePerf();
    if (this.activeSection === 'performance' && this.perfTab === 'billing') {
      setTimeout(() => this.renderPerformanceChart(), 0);
    }
  }

  setPerfDept(dept: string): void {
    this.perfDept = dept;
    this.recomputePerf();
    if (this.activeSection === 'performance' && this.perfTab === 'billing') {
      setTimeout(() => this.renderPerformanceChart(), 0);
    }
  }

  toggleTheme(): void {
    this.theme.toggle();
    this.isDark = this.theme.isDark;
    if (this.activeSection === 'overview')                                                  setTimeout(() => this.renderOverviewCharts(), 80);
    if (this.activeSection === 'performance' && this.perfTab === 'billing')                 setTimeout(() => this.renderPerformanceChart(), 80);
  }

  logout(): void { this.auth.logout(); }

  getUserName(userId: string): string {
    return this.userNameCache.get(userId) ?? '—';
  }

  getRoleLabel(role: string): string { return ROLE_LABELS[role] ?? role; }

  getBadge(key: string): number {
    if (key === 'overdue') return this.overdueCount;
    if (key === 'alerts')  return this.alertsCount;
    return 0;
  }

  toggleNotif(): void { this.notifOpen = !this.notifOpen; }

  closeNotif(): void { this.notifOpen = false; }

  get notifTotalCount(): number {
    return this.notifService.unreadCount + (this.perms.canViewAlerts ? this.alertsCount : 0);
  }

  onNotifClick(n: AppNotification): void {
    if (!n.isRead) this.notifService.markRead(n.id);
    if (n.taskId) { this.navigate('tasks'); this.setTasksTab('list'); }
    this.closeNotif();
  }

  notifMarkAll(): void { this.notifService.markAllRead(); }

  // ── Task arrays — all backed by recompute() cache ─────────
  get visibleTasks():     Task[] { return this._visibleTasks; }
  get newTasks():         Task[] { return this._newTasks; }
  get refinementTasks():  Task[] { return this._refinementTasks; }
  get readyTasks():       Task[] { return this._readyTasks; }
  get inProgressTasks():  Task[] { return this._inProgressTasks; }
  get reviewTasks():      Task[] { return this._reviewTasks; }
  get completedTasks():   Task[] { return this._completedTasks; }
  get overdueTasks():     Task[] { return this._overdueTasks; }
  get topPriorityTasks(): Task[] { return this._topPriorityTasks; }
  get upcomingDeadlines(): Task[] { return this._upcomingDeadlines; }
  get upcomingWeekTasks(): Task[] { return this._upcomingWeekTasks; }

  // filteredTasks depends on live filter inputs so remains a getter,
  // but uses the pre-cached _visibleTasks to avoid chained work
  get filteredTasks(): Task[] {
    const s    = this.taskSearch.toLowerCase();
    const from = this.taskDateFrom ? new Date(this.taskDateFrom) : null;
    const to   = this.taskDateTo   ? new Date(this.taskDateTo)   : null;
    if (to) to.setHours(23, 59, 59, 999);
    return this._visibleTasks.filter(t => {
      const matchSearch   = !s || t.title.toLowerCase().includes(s) || (t.description ?? '').toLowerCase().includes(s);
      const matchStatus   = !this.taskStatusFilter   || t.status   === this.taskStatusFilter;
      const matchPriority = !this.taskPriorityFilter || t.priority === this.taskPriorityFilter;
      const matchFrom     = !from || !t.deadline || new Date(t.deadline) >= from;
      const matchTo       = !to   || !t.deadline || new Date(t.deadline) <= to;
      return matchSearch && matchStatus && matchPriority && matchFrom && matchTo;
    });
  }

  clearDateFilter(): void { this.taskDateFrom = ''; this.taskDateTo = ''; this.taskPage = 0; }

  // Paginated task slice (clamps page index when filters shrink results)
  get pagedTasks(): Task[] {
    const filtered = this.filteredTasks;
    const maxPage  = Math.max(0, Math.ceil(filtered.length / this.taskPageSize) - 1);
    if (this.taskPage > maxPage) this.taskPage = maxPage;
    return filtered.slice(this.taskPage * this.taskPageSize, (this.taskPage + 1) * this.taskPageSize);
  }
  get taskPageCount(): number { return Math.max(1, Math.ceil(this.filteredTasks.length / this.taskPageSize)); }
  prevTaskPage(): void { if (this.taskPage > 0) this.taskPage--; }
  nextTaskPage(): void { if (this.taskPage < this.taskPageCount - 1) this.taskPage++; }
  resetTaskPage(): void { this.taskPage = 0; }

  /** Month/range filter applied to _visibleTasks — used for stage count cards (no stage filter) */
  get filteredCountTasks(): Task[] {
    if (this.boardFilterMode === 'month') {
      if (!this.boardMonth) return this._visibleTasks;
      const [year, month] = this.boardMonth.split('-').map(Number);
      return this._visibleTasks.filter(t => {
        if (!t.deadline) return true;
        const d = new Date(t.deadline);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
    }
    const from = this.boardDateFrom ? new Date(this.boardDateFrom) : null;
    const to   = this.boardDateTo   ? new Date(this.boardDateTo)   : null;
    if (to) to.setHours(23, 59, 59, 999);
    if (!from && !to) return this._visibleTasks;
    return this._visibleTasks.filter(t => {
      if (!t.deadline) return true;
      const d = new Date(t.deadline);
      return (!from || d >= from) && (!to || d <= to);
    });
  }

  // Stage counts for the clickable flow-node cards (reflect active month/range filter)
  get boardCountNew():        number { return this.filteredCountTasks.filter(t => ['new','open','pending'].includes(t.status)).length; }
  get boardCountRefinement(): number { return this.filteredCountTasks.filter(t => ['refinement','requirement-gathering'].includes(t.status)).length; }
  get boardCountReady():      number { return this.filteredCountTasks.filter(t => ['ready','awaiting-client'].includes(t.status)).length; }
  get boardCountInProgress(): number { return this.filteredCountTasks.filter(t => t.status === 'in-progress').length; }
  get boardCountReview():     number { return this.filteredCountTasks.filter(t => ['review','under-review'].includes(t.status)).length; }
  get boardCountComplete():   number { return this.filteredCountTasks.filter(t => ['complete','completed'].includes(t.status)).length; }

  /** filteredBoardTasks: filteredCountTasks + optional stage filter (drives the kanban columns) */
  get filteredBoardTasks(): Task[] {
    let list = this.filteredCountTasks;
    if (this.boardStageFilter) {
      const compat: Record<string, string[]> = {
        new:           ['new','open','pending'],
        refinement:    ['refinement','requirement-gathering'],
        ready:         ['ready','awaiting-client'],
        'in-progress': ['in-progress'],
        review:        ['review','under-review'],
        complete:      ['complete','completed'],
      };
      const allowed = compat[this.boardStageFilter] ?? [this.boardStageFilter];
      list = list.filter(t => allowed.includes(t.status));
    }
    return list;
  }

  get boardHasFilter(): boolean {
    return this.boardFilterMode === 'month' ? !!this.boardMonth : !!(this.boardDateFrom || this.boardDateTo);
  }

  /** The columns visible on the kanban board based on the user's role */
  get visibleKanbanStatuses(): KanbanStatus[] | null {
    if (this.perms.canSeeEarlyStages) return null;
    return ['ready', 'in-progress', 'review', 'complete'];
  }

  /** Pre-fill deadline for new tasks based on active board filter */
  get defaultTaskDeadline(): string {
    if (this.boardFilterMode === 'month' && this.boardMonth) return `${this.boardMonth}-01`;
    if (this.boardFilterMode === 'range' && this.boardDateFrom) return this.boardDateFrom;
    return '';
  }

  clearBoardFilter(): void {
    this.boardMonth    = '';
    this.boardDateFrom = '';
    this.boardDateTo   = '';
  }

  switchBoardMode(mode: 'month' | 'range'): void {
    if (this.boardFilterMode === mode) return;
    if (mode === 'range' && this.boardMonth) {
      // Carry the selected month over as a date range (first → last day of that month)
      const [y, m] = this.boardMonth.split('-').map(Number);
      const last   = new Date(y, m, 0).getDate();
      const pad    = (n: number) => String(n).padStart(2, '0');
      this.boardDateFrom = `${y}-${pad(m)}-01`;
      this.boardDateTo   = `${y}-${pad(m)}-${last}`;
      this.boardMonth    = '';
    } else if (mode === 'month' && (this.boardDateFrom || this.boardDateTo)) {
      // Carry date-from back to a month string when switching the other way
      const src = this.boardDateFrom || this.boardDateTo;
      this.boardMonth    = src.substring(0, 7);
      this.boardDateFrom = '';
      this.boardDateTo   = '';
    }
    this.boardFilterMode = mode;
  }

  selectStage(stage: KanbanStatus | null): void {
    this.boardStageFilter = this.boardStageFilter === stage ? null : stage;
  }

  getDaysLeft(deadline: string): string {
    const diff = Math.floor((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0)   return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Today';
    return `${diff}d left`;
  }

  // ── Billing helpers ──────────────────────────────────────
  parseBilling(val?: string): number {
    if (!val || val === 'Internal' || val === 'N/A') return 0;
    const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  }

  // Scalar metrics — backed by recompute() cache
  get billedTotal():     number { return this._billedTotal; }
  get collectedTotal():  number { return this._collectedTotal; }
  get pendingBilling():  number { return Math.max(0, this._billedTotal - this._collectedTotal); }
  get billingRecovery(): number { return this._billedTotal > 0 ? Math.round((this._collectedTotal / this._billedTotal) * 100) : 100; }
  get weeklyVelocity():  number { return this._weeklyVelocity; }
  get teamHealthScore(): number { return this._teamHealthScore; }

  // Partly-paid tasks (billed but not fully collected)
  get partlyPaidTasks(): Task[] {
    return this._visibleTasks.filter(t => t.paymentStatus === 'Partly Paid');
  }
  get pendingPaymentTasks(): Task[] {
    return this._visibleTasks.filter(t => t.paymentStatus === 'Pending' && this.parseBilling(t.billing) > 0);
  }

  // ── recompute() — call after any data mutation ──────────
  private recompute(): void {
    const now = new Date();

    // ── Permissions + nav (must be first — everything else depends on perms) ─
    this.perms      = this.permService.permsFor(this.currentUser?.role ?? '');
    this._navGroups = this.buildNavGroups();

    // ── O(1) lookup caches — build immediately so helpers below can use them ─
    this.userNameCache = new Map(this.users.map(u => [u.id, u.name]));
    const countMap = new Map<string, number>();
    this.tasks.filter(t => t.status !== 'complete' && t.status !== 'completed')
      .forEach(t => { if (t.assignee) countMap.set(t.assignee, (countMap.get(t.assignee) ?? 0) + 1); });
    this.activeTaskCountCache = countMap;

    // ── Visible tasks (RBAC) ──────────────────────────────────────────────────
    this._visibleTasks = this.perms.canViewAllTasks
      ? this.tasks
      : this.tasks.filter(t => t.assignee === this.currentUser?.id);

    // ── Stage slices ──────────────────────────────────────────────────────────
    this._newTasks        = this._visibleTasks.filter(t => t.status === 'new'        || t.status === 'open'            || t.status === 'pending');
    this._refinementTasks = this._visibleTasks.filter(t => t.status === 'refinement' || t.status === 'requirement-gathering');
    this._readyTasks      = this._visibleTasks.filter(t => t.status === 'ready'      || t.status === 'awaiting-client');
    this._inProgressTasks = this._visibleTasks.filter(t => t.status === 'in-progress');
    this._reviewTasks     = this._visibleTasks.filter(t => t.status === 'review'     || t.status === 'under-review');
    this._completedTasks  = this._visibleTasks.filter(t => t.status === 'complete'   || t.status === 'completed');

    // Local vars reused by health score + KPIs
    const totalTasks = this.tasks.length;
    const completeCt = this._completedTasks.length;
    const pendingCt  = totalTasks - completeCt;

    // ── Overdue ────────────────────────────────────────────────────────────────
    this._overdueTasks = this._visibleTasks.filter(t =>
      t.deadline && new Date(t.deadline) < now && t.status !== 'complete' && t.status !== 'completed'
    );
    this.overdueCount = this._overdueTasks.length;

    // ── Top priority / deadlines ──────────────────────────────────────────────
    this._topPriorityTasks = this._visibleTasks
      .filter(t => t.status !== 'complete' && t.status !== 'completed' && (t.priority === 'High' || t.priority === 'Urgent'))
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))
      .slice(0, 5);

    this._upcomingDeadlines = [...this._visibleTasks]
      .filter(t => t.status !== 'complete' && t.status !== 'completed')
      .sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });

    const today    = new Date(now); today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    this._upcomingWeekTasks = this._visibleTasks
      .filter(t => t.status !== 'complete' && t.status !== 'completed' && t.deadline
                   && new Date(t.deadline) >= today && new Date(t.deadline) <= nextWeek)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

    // ── Billing / velocity / health score ─────────────────────────────────────
    this._billedTotal    = this.tasks.reduce((s, t) => s + this.parseBilling(t.billing), 0);
    this._collectedTotal = this.tasks.filter(t => t.paymentStatus === 'Paid').reduce((s, t) => s + this.parseBilling(t.billing), 0);

    const cutoff = new Date(now.getTime() - 42 * 24 * 60 * 60 * 1000);
    const recentDone = this.tasks.filter(t =>
      (t.status === 'complete' || t.status === 'completed') && t.completedAt && new Date(t.completedAt) >= cutoff
    ).length;
    this._weeklyVelocity = Math.round((recentDone / 6) * 10) / 10;

    this._teamHealthScore = !totalTasks ? 100 : Math.round(
      ((completeCt / totalTasks * 100)
      + (this._billedTotal > 0 ? (this._collectedTotal / this._billedTotal * 100) : 100)
      + (pendingCt > 0 ? (1 - this.overdueCount / pendingCt) * 100 : 100)) / 3
    );

    // ── Heatmap ───────────────────────────────────────────────────────────────
    this.heatmapCells = Array.from({ length: 35 }, (_, i) => {
      const d       = new Date(now.getTime() - (34 - i) * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const count   = this.activities.filter(a => a.timestamp?.startsWith(dateStr)).length;
      const level   = count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 10 ? 3 : 4;
      return { date: dateStr, count, level };
    });

    // ── Member performance ────────────────────────────────────────────────────
    this.memberPerfData = this.users.map(u => {
      const uTasks         = this.tasks.filter(t => t.assignee === u.id);
      const completed      = uTasks.filter(t => t.status === 'complete' || t.status === 'completed').length;
      const total          = uTasks.length;
      const billed         = uTasks.reduce((s, t) => s + this.parseBilling(t.billing), 0);
      const collected      = uTasks.filter(t => t.paymentStatus === 'Paid').reduce((s, t) => s + this.parseBilling(t.billing), 0);
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      const score          = Math.min(100, Math.round(completionRate * 0.6 + (billed > 0 ? (collected / billed) * 40 : 40)));
      return { ...u, completed, total, billed, collected, completionRate, score };
    }).sort((a, b) => b.score - a.score);

    // ── Alerts ────────────────────────────────────────────────────────────────
    this.cachedCriticalAlerts = this._overdueTasks
      .filter(t => (now.getTime() - new Date(t.deadline!).getTime()) > 7 * 24 * 60 * 60 * 1000)
      .map(t => `"${t.title}" is severely overdue (>7 days) — assigned to ${this.getUserName(t.assignee)}`);

    const warns: string[] = [];
    this._visibleTasks.forEach(t => {
      if (t.status !== 'complete' && t.status !== 'completed' && t.deadline) {
        const days = (now.getTime() - new Date(t.deadline).getTime()) / (1000 * 60 * 60 * 24);
        if (days > 0 && days <= 7)
          warns.push(`"${t.title}" overdue by ${Math.ceil(days)}d — ${this.getUserName(t.assignee)}`);
      }
      if (this.parseBilling(t.billing) > 1000 && t.paymentStatus === 'Pending' && t.status !== 'complete' && t.status !== 'completed')
        warns.push(`High-value billing pending: ₹${t.billing} for "${t.title}"`);
    });
    this.cachedWarningAlerts = warns;
    this.alertsCount = this.cachedCriticalAlerts.length + warns.length;

    // ── Health KPIs ───────────────────────────────────────────────────────────
    this.cachedHealthKPIs = [
      { label: 'Completion Rate',     value: totalTasks > 0 ? Math.round((completeCt / totalTasks) * 100) : 100,                                    icon: 'check-circle', color: '#10b981' },
      { label: 'Billing Recovery',    value: this._billedTotal > 0 ? Math.round((this._collectedTotal / this._billedTotal) * 100) : 100,             icon: 'indian-rupee', color: '#3b82f6' },
      { label: 'Zero-Overdue Target', value: pendingCt > 0 ? Math.round((1 - this.overdueCount / pendingCt) * 100) : 100,                           icon: 'clock',        color: '#f59e0b' },
    ];

    // ── Idle users ────────────────────────────────────────────────────────────
    const usersWithActive = new Set(
      this.tasks.filter(t => t.status !== 'complete' && t.status !== 'completed').map(t => t.assignee)
    );
    this.idleUsersData = this.users.filter(u => !usersWithActive.has(u.id));

    // ── Org hierarchy tiers ───────────────────────────────────────────────────
    const TIER_LABELS: Record<number, string> = {
      1: 'Administration',
      2: 'Senior Management',
      3: 'Management',
      4: 'Associates',
      5: 'Staff & Trainees',
    };
    const tierMap = new Map<number, User[]>();
    this.users.forEach(u => {
      const t = getRoleTier(u.role);
      if (!tierMap.has(t)) tierMap.set(t, []);
      tierMap.get(t)!.push(u);
    });
    this.orgTiers = Array.from(tierMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([rank, members]) => ({ rank, label: TIER_LABELS[rank] ?? `Tier ${rank}`, members }));

    this.recomputePerf();
  }

  private recomputePerf(): void {
    const now = new Date();
    let cutoff: Date | null = null;
    if (this.perfPeriod === 'month') {
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (this.perfPeriod === 'quarter') {
      cutoff = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    }
    this.filteredPerfData = this.users
      .filter(u => !this.perfDept || u.department === this.perfDept)
      .map(u => {
        let uTasks = this.tasks.filter(t => t.assignee === u.id);
        if (cutoff) uTasks = uTasks.filter(t => t.deadline && new Date(t.deadline) >= cutoff!);
        const completed      = uTasks.filter(t => t.status === 'complete' || t.status === 'completed').length;
        const total          = uTasks.length;
        const billed         = uTasks.reduce((s, t) => s + this.parseBilling(t.billing), 0);
        const collected      = uTasks.filter(t => t.paymentStatus === 'Paid').reduce((s, t) => s + this.parseBilling(t.billing), 0);
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const overdue        = uTasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'complete' && t.status !== 'completed').length;
        const score          = Math.min(100, Math.round(completionRate * 0.6 + (billed > 0 ? (collected / billed) * 40 : 40)));
        return { ...u, completed, total, billed, collected, completionRate, overdue, score };
      })
      .sort((a, b) => b.score - a.score);
    this.perfNoOverdue    = this.filteredPerfData.every(m => m.overdue === 0);
    this.perfUniqueDepts  = [...new Set(this.users.map(u => u.department ?? '').filter(Boolean))].sort();
  }


  getScoreClass(score: number): string {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-mid';
    return 'score-low';
  }

  // ── Activity pagination ──────────────────────────────────
  get paginatedActivities(): Activity[] {
    const start = this.activityPage * this.activityPageSize;
    return this.activities.slice(start, start + this.activityPageSize);
  }

  get totalActivityPages(): number {
    return Math.max(1, Math.ceil(this.activities.length / this.activityPageSize));
  }

  prevActivityPage(): void { if (this.activityPage > 0) this.activityPage--; }
  nextActivityPage(): void { if (this.activityPage < this.totalActivityPages - 1) this.activityPage++; }

  formatActivity(act: Activity): string {
    const action = act.action ?? '';
    const target = act.target ? `"${act.target}"` : 'an item';
    const who    = act.userId ? this.getUserName(act.userId) : '';

    const a = action.toLowerCase();
    if (a.includes('created task'))                    return `${who} created task ${target}`;
    if (a.includes('added team'))                      return `${who} added team member ${target}`;
    if (a.includes('removed team'))                    return `${who} removed team member ${target}`;
    if (a.includes('deleted'))                         return `${who} deleted ${target}`;
    if (a.includes('completed'))                       return `${who} completed ${target}`;
    if (a.includes('moved'))                           return `${who} moved ${target} → ${action.replace(/.*moved to /i, '')}`;
    if (a.includes('updated'))                         return `${who} updated ${target}`;
    if (a.includes('added'))                           return `${who} added ${target}`;
    return who ? `${who} — ${action} on ${target}` : `${action} ${target}`;
  }

  // ── Activity feed icons/colors ───────────────────────────
  getActivityColor(action: string): string {
    const a = action.toLowerCase();
    if (a.includes('created') || a.includes('added'))               return '#10b981';
    if (a.includes('deleted'))                                       return '#ef4444';
    if (a.includes('completed') || a.includes('moved to completed')) return '#10b981';
    if (a.includes('moved'))                                         return '#8b5cf6';
    return '#3b82f6';
  }

  getActivityIcon(action: string): string {
    const a = action.toLowerCase();
    if (a.includes('created') || a.includes('added')) return '+';
    if (a.includes('deleted'))                         return '✕';
    if (a.includes('completed'))                       return '✓';
    if (a.includes('moved'))                           return '→';
    return '✎';
  }

  // ── Task CRUD ────────────────────────────────────────────
  openCreateTask(): void { this.editingTask = null; this.taskModalVisible = true; }
  openEditTask(task: Task): void { this.editingTask = task; this.taskModalVisible = true; }
  closeTaskModal(): void { this.taskModalVisible = false; this.editingTask = null; }

  openCreateTaskInColumn(status: KanbanStatus): void {
    this.editingTask = null;
    this._pendingStatus = status;
    this.taskModalVisible = true;
  }

  onSaveTask(payload: TaskSavePayload): void {
    this.savingTask = true;
    let { request } = payload;
    const { files } = payload;

    if (!this.editingTask && this._pendingStatus) {
      request = { ...request, status: this._pendingStatus };
      this._pendingStatus = null;
    }
    const op = this.editingTask
      ? this.api.updateTask(this.editingTask.id, request)
      : this.api.createTask(request);

    op.subscribe({
      next: (saved) => {
        this.tasks = this.editingTask
          ? this.tasks.map(t => t.id === saved.id ? saved : t)
          : [saved, ...this.tasks];
        this.recompute();
        this.api.logActivity({
          entityType: 'Task', entityId: saved.id,
          action: this.editingTask ? 'Updated Task' : 'Created Task', target: saved.title,
        }).subscribe();
        // Upload any attached files after task is created/updated
        files.forEach(file => this.api.uploadAttachment(saved.id, file).subscribe());
        this.savingTask = false;
        this.closeTaskModal();
      },
      error: () => { this.savingTask = false; },
    });
  }

  onKanbanMove(event: { taskId: string; status: KanbanStatus }): void {
    this.api.updateTask(event.taskId, { status: event.status }).subscribe({
      next: (saved) => {
        this.tasks = this.tasks.map(t => t.id === saved.id ? saved : t);
        this.recompute();
        this.api.logActivity({
          entityType: 'Task', entityId: saved.id,
          action: `Moved to ${event.status}`, target: saved.title,
        }).subscribe();
      },
    });
  }

  confirmDelete(taskId: string): void { this.deleteConfirmId = taskId; }
  cancelDelete(): void { this.deleteConfirmId = null; }

  deleteTask(): void {
    if (!this.deleteConfirmId) return;
    const id = this.deleteConfirmId;
    this.deleteConfirmId = null;
    const task = this.tasks.find(t => t.id === id);
    this.api.deleteTask(id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.recompute();
        if (task) this.api.logActivity({ entityType: 'Task', entityId: id, action: 'Deleted Task', target: task.title }).subscribe();
      },
    });
  }

  // ── User management ──────────────────────────────────────
  openAddMember(): void {
    this.editingUser = null;
    this.userModalVisible = true;
    this.memberDetailVisible = false;
  }

  openEditMember(user: User): void {
    this.editingUser = user;
    this.userModalVisible = true;
    this.memberDetailVisible = false;
  }

  closeUserModal(): void {
    this.userModalVisible = false;
    this.editingUser = null;
  }

  openMemberDetail(user: User): void {
    this.selectedMember = user;
    this.memberDetailVisible = true;
  }

  closeMemberDetail(): void {
    this.memberDetailVisible = false;
    this.selectedMember = null;
  }

  get filteredMembers(): User[] {
    const s = this.memberSearch.toLowerCase();
    if (!s) return this.users;
    return this.users.filter(u =>
      u.name.toLowerCase().includes(s) ||
      u.role.toLowerCase().includes(s) ||
      (u.department ?? '').toLowerCase().includes(s) ||
      (u.designation ?? '').toLowerCase().includes(s)
    );
  }

  // Paginated team slice (grid view only; clamps page when search shrinks results)
  get pagedMembers(): User[] {
    const filtered = this.filteredMembers;
    const maxPage  = Math.max(0, Math.ceil(filtered.length / this.teamPageSize) - 1);
    if (this.teamPage > maxPage) this.teamPage = maxPage;
    return filtered.slice(this.teamPage * this.teamPageSize, (this.teamPage + 1) * this.teamPageSize);
  }
  get teamPageCount(): number { return Math.max(1, Math.ceil(this.filteredMembers.length / this.teamPageSize)); }
  prevTeamPage(): void { if (this.teamPage > 0) this.teamPage--; }
  nextTeamPage(): void { if (this.teamPage < this.teamPageCount - 1) this.teamPage++; }
  resetTeamPage(): void { this.teamPage = 0; }

  // Build a flat list with depth + tree-line metadata for the visual tree view
  get hierarchyList(): { user: User; depth: number; isLast: boolean; parentContinues: boolean[] }[] {
    type Item = { user: User; depth: number; isLast: boolean; parentContinues: boolean[] };
    const result: Item[] = [];
    const visited = new Set<string>();

    const addNode = (user: User, depth: number, isLast: boolean, parentContinues: boolean[]) => {
      if (visited.has(user.id)) return;
      visited.add(user.id);
      result.push({ user, depth, isLast, parentContinues });
      const children = this.users
        .filter(u => u.reportsTo === user.id)
        .sort((a, b) => a.name.localeCompare(b.name));
      children.forEach((child, i) => {
        const childIsLast = i === children.length - 1;
        // propagate whether THIS level continues (not last) so children can draw vertical guides
        addNode(child, depth + 1, childIsLast, [...parentContinues, !isLast]);
      });
    };

    const userIds = new Set(this.users.map(u => u.id));
    const roots = this.users
      .filter(u => !u.reportsTo || !userIds.has(u.reportsTo))
      .sort((a, b) => a.name.localeCompare(b.name));
    roots.forEach((root, i) => addNode(root, 0, i === roots.length - 1, []));

    this.users.filter(u => !visited.has(u.id)).forEach(u => addNode(u, 0, true, []));
    return result;
  }

  onSaveUser(payload: UserSavePayload & { files?: { file: File; docType: string }[] }): void {
    this.savingUser = true;

    if (payload.isEdit && payload.userId) {
      const request = payload.request as UpdateProfileRequest;
      this.api.updateUser(payload.userId, request).subscribe({
        next: (updated) => {
          this.users = this.users.map(u => u.id === updated.id ? updated : u);
          if (this.currentUser?.id === updated.id) {
            this.auth.updateCurrentUser(updated);
            this.currentUser = updated;
          }
          this.recompute();
          // Upload any pending docs
          (payload.files ?? []).forEach(p =>
            this.api.uploadMemberDocument(updated.id, p.file, p.docType).subscribe()
          );
          this.api.logActivity({ entityType: 'User', entityId: updated.id, action: 'Updated Team Member', target: updated.name }).subscribe();
          this.savingUser = false;
          this.closeUserModal();
        },
        error: () => { this.savingUser = false; },
      });
    } else {
      const request = payload.request as CreateUserRequest;
      this.api.createUser(request).subscribe({
        next: (user) => {
          this.users = [...this.users, user];
          try { this.recompute(); } catch (e) { console.error('[Dashboard] recompute failed after adding user:', e); }
          (payload.files ?? []).forEach(p =>
            this.api.uploadMemberDocument(user.id, p.file, p.docType).subscribe()
          );
          this.api.logActivity({ entityType: 'User', entityId: user.id, action: 'Added Team Member', target: user.name }).subscribe();
          this.savingUser = false;
          this.closeUserModal();
          this.cdr.detectChanges();
        },
        error: () => { this.savingUser = false; this.cdr.detectChanges(); },
      });
    }
  }

  confirmDeleteUser(userId: string): void { this.deleteUserConfirmId = userId; }
  cancelDeleteUser(): void { this.deleteUserConfirmId = null; }

  deleteUser(): void {
    if (!this.deleteUserConfirmId) return;
    const id   = this.deleteUserConfirmId;
    this.deleteUserConfirmId = null;
    const user = this.users.find(u => u.id === id);
    this.api.deleteUser(id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== id);
        this.recompute();
        if (user) this.api.logActivity({ entityType: 'User', entityId: id, action: 'Removed Team Member', target: user.name }).subscribe();
      },
    });
  }

  // ── Profile ──────────────────────────────────────────────
  onSaveProfile(request: UpdateProfileRequest): void {
    if (!this.currentUser) return;
    this.savingProfile = true;
    this.api.updateUser(this.currentUser.id, request).subscribe({
      next: (updated) => {
        this.auth.updateCurrentUser(updated);
        this.currentUser = updated;
        this.users = this.users.map(u => u.id === updated.id ? updated : u);
        this.recompute();
        this.savingProfile = false;
        this.profileModalVisible = false;
      },
      error: () => { this.savingProfile = false; },
    });
  }

  // ── CSV Export ───────────────────────────────────────────
  exportTasksCsv(): void {
    const headers = ['Title', 'Description', 'Assignee', 'Priority', 'Status', 'Deadline', 'Billing', 'Payment', 'Client', 'Remarks'];
    const rows = this.filteredTasks.map(t =>
      [t.title, t.description ?? '', this.getUserName(t.assignee), t.priority, t.status,
       t.deadline ? new Date(t.deadline).toLocaleDateString('en-IN') : '',
       t.billing ?? '', t.paymentStatus ?? '', t.clientContact ?? '', t.remarks ?? '']
      .map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    );
    const csv  = [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.href  = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = `teampulse-tasks-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  // ── Helpers ──────────────────────────────────────────────
  get idleUserNames(): string {
    return this.idleUsersData.map(u => u.name).join(', ');
  }

  getMemberRecovery(m: { billed: number; collected: number }): number {
    return m.billed > 0 ? Math.round((m.collected / m.billed) * 100) : 100;
  }

  getDaysOverdue(task: Task): number {
    if (!task.deadline) return 0;
    return Math.max(0, Math.ceil((Date.now() - new Date(task.deadline).getTime()) / (1000 * 60 * 60 * 24)));
  }

  isOverdue(task: Task): boolean {
    return !!(task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed');
  }

  getTasksForUser(userId: string): number {
    return this.activeTaskCountCache.get(userId) ?? 0;
  }

  getTierBadge(rank: number): string {
    return ['', '🔑', '⭐', '📌', '👤', '🎓'][rank] ?? '👤';
  }

  trackById(_: number, item: { id: string }): string { return item.id; }
  trackByIdx(i: number): number { return i; }

  // ── Charts ───────────────────────────────────────────────
  private get chartTextColor(): string { return this.isDark ? '#94A3B8' : '#374151'; }
  private get chartGridColor(): string { return this.isDark ? '#334155' : '#e5e7eb'; }

  private destroyAllCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts.clear();
  }

  private renderOverviewCharts(): void {
    this.renderDonutChart();
    this.renderLineChart();
    this.renderBarChart();
  }

  private renderDonutChart(): void {
    const el = document.getElementById('chart-donut') as HTMLCanvasElement | null;
    if (!el) return;
    this.charts.get('donut')?.destroy();
    const c = new Chart(el, {
      type: 'doughnut',
      data: {
        labels: ['New', 'Refinement', 'Ready', 'In Progress', 'Review', 'Complete'],
        datasets: [{ data: [
          this.newTasks.length, this.refinementTasks.length, this.readyTasks.length,
          this.inProgressTasks.length, this.reviewTasks.length, this.completedTasks.length,
        ], backgroundColor: ['#6b7280', '#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899', '#10b981'], borderWidth: 0, hoverOffset: 6 }],
      },
      options: { animation: false, responsive: true, maintainAspectRatio: true, aspectRatio: 1.4, cutout: '65%', plugins: { legend: { labels: { color: this.chartTextColor, font: { family: 'DM Sans', size: 11 }, boxWidth: 12 } } } },
    });
    this.charts.set('donut', c);
  }

  private renderLineChart(): void {
    const el = document.getElementById('chart-line') as HTMLCanvasElement | null;
    if (!el) return;
    this.charts.get('line')?.destroy();
    const now = new Date();
    const weekCounts = [0, 0, 0, 0, 0, 0];
    this.tasks.filter(t => t.status === 'completed' && t.completedAt).forEach(t => {
      const diff = Math.floor((now.getTime() - new Date(t.completedAt!).getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (diff >= 0 && diff < 6) weekCounts[5 - diff]++;
    });
    const c = new Chart(el, {
      type: 'line',
      data: {
        labels: ['Wk-5', 'Wk-4', 'Wk-3', 'Wk-2', 'Wk-1', 'This Wk'],
        datasets: [{ label: 'Completions', data: weekCounts, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.12)', tension: 0.4, fill: true, pointBackgroundColor: '#3b82f6', pointRadius: 4 }],
      },
      options: { animation: false, responsive: true, maintainAspectRatio: true, aspectRatio: 1.6, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { color: this.chartTextColor, stepSize: 1 }, grid: { color: this.chartGridColor } }, x: { ticks: { color: this.chartTextColor }, grid: { display: false } } } },
    });
    this.charts.set('line', c);
  }

  private renderBarChart(): void {
    const el = document.getElementById('chart-bar') as HTMLCanvasElement | null;
    if (!el) return;
    this.charts.get('bar')?.destroy();
    const workload: Record<string, number> = {};
    this.tasks.filter(t => t.status !== 'completed').forEach(t => { workload[t.assignee] = (workload[t.assignee] || 0) + 1; });
    const top = Object.entries(workload).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const c = new Chart(el, {
      type: 'bar',
      data: {
        labels: top.map(([id]) => this.getUserName(id).split(' ')[0]),
        datasets: [{ label: 'Active Tasks', data: top.map(([, n]) => n), backgroundColor: '#10b981', borderRadius: 4 }],
      },
      options: { animation: false, responsive: true, maintainAspectRatio: true, aspectRatio: 4, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { color: this.chartTextColor, stepSize: 1 }, grid: { color: this.chartGridColor } }, x: { ticks: { color: this.chartTextColor }, grid: { display: false } } } },
    });
    this.charts.set('bar', c);
  }

  private renderPerformanceChart(): void {
    const el = document.getElementById('chart-dual-bar') as HTMLCanvasElement | null;
    if (!el) return;
    this.charts.get('dualbar')?.destroy();
    const top5 = this.filteredPerfData.slice(0, 5);
    const c = new Chart(el, {
      type: 'bar',
      data: {
        labels: top5.map(u => u.name.split(' ')[0]),
        datasets: [
          { label: 'Billed (₹)', data: top5.map(u => u.billed), backgroundColor: '#3b82f6', borderRadius: 4 },
          { label: 'Collected (₹)', data: top5.map(u => u.collected), backgroundColor: '#10b981', borderRadius: 4 },
        ],
      },
      options: { animation: false, responsive: true, plugins: { legend: { labels: { color: this.chartTextColor } } }, scales: { y: { beginAtZero: true, ticks: { color: this.chartTextColor }, grid: { color: this.chartGridColor } }, x: { ticks: { color: this.chartTextColor }, grid: { display: false } } } },
    });
    this.charts.set('dualbar', c);
  }
}
