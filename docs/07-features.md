# 07 — Features

## Multi-Tenancy

TeamPulse is a multi-tenant SaaS platform. Each company is a **tenant** identified by a short company code (e.g. `KPA001`).

**Tenant isolation:** EF Core global query filters scope every DB query to `CompanyId == tenantId` automatically, derived from the JWT `companyId` claim. Platform admins (role `platform-admin`, `CompanyId = PLATFORM`) bypass all filters.

**Tenant branding:** Each tenant has a Name, Tagline, and optional LogoUrl. On login, Angular fetches branding via `GET /api/config?tenantId=X` and caches it in `TenantService`. The sidebar and page title reflect the active tenant's name instead of a hardcoded string.

**PLATFORM tenant:** A reserved tenant created at startup for the parent company's own admin. Users with `companyId = PLATFORM` and role `platform-admin` access the Platform Admin Panel.

---

## Platform Admin Panel (`/platform-admin`)

Accessible only to users with role `platform-admin`. Redirected here automatically after login.

Features:
- **Tenant list** — table showing all tenants: Code, Name, Tagline, User Count, Created, Status (Active/Inactive)
- **Add Tenant** — slide-over form: company details (code, name, tagline, logo URL) + first admin account (username, password, full name, email)
- **Edit Tenant** — update branding (name, tagline, logo URL) for any existing tenant
- **Suspend / Reactivate** — toggle a tenant's `IsActive` flag. Suspended tenants cannot log in. The PLATFORM tenant cannot be suspended.

**Company code rules:** 3–10 uppercase letters/digits (e.g. `KPA001`, `ABC`). Immutable after creation.

---

## Authentication

**Login** (`/login`)
- Enter **Company Code**, username, and password
- API validates the tenant is active before checking credentials
- Returns JWT token (8-hour expiry) + user object
- Token stored in `sessionStorage` (`tp_token`)
- On success: platform-admin → `/platform-admin`; all other roles → `/dashboard`
- **Pre-warm ping:** On page load, Angular immediately fires `GET /api/health` to warm up the Container App. When the user clicks Sign In, the login waits for the warm-up to complete first, eliminating the cold-start delay.
- 30-minute inactivity timeout — auto-logout after idle

**Forgot Password** (`/forgot-password`)
- User enters **Company Code** and email address
- API validates the tenant is active, then looks up the email scoped to that tenant only
- Always returns 200 regardless of whether the email or company code is valid (prevents enumeration)
- Sends password reset link if the email matches a user in that tenant
- Requires SMTP configured via env vars

**Reset Password** (`/reset-password?token=...`)
- User arrives via emailed link with a time-limited token (1 hour)
- Sets a new password

---

## Dashboard Overview

The main view after login. Shows the full company pulse at a glance.

**Stat cards (8):**
- Total tasks, completed tasks, overdue tasks, tasks due this week
- Team size, pending billing, billing recovery rate, active this month

**Charts (Chart.js):**
- Donut — task status distribution
- Line — weekly task completion velocity
- Bar — tasks by department

**35-day activity heatmap** — calendar grid showing daily task completion density

**Top priority table** — urgent + overdue tasks at a glance

**Recent activity feed** — last 5 audit log entries

---

## Tasks

**Task Board** (`Tasks` in sidebar)

Two sub-tabs:

1. **Board** — Kanban board with 6 columns (New → Refinement → In Progress → Review → Blocked → Complete). Month filter. HTML5 drag-and-drop between columns.

2. **Workflow Guide** — Describes each stage with explanations for the team.

**Task fields:**
- Title, Description
- Assignee (dropdown of team members)
- Priority (Low / Medium / High / Urgent)
- Status (new / refinement / in-progress / review / blocked / complete)
- Due date
- Client Contact
- Billing Details (amount)
- Payment Status (Pending / Received / N/A)
- Remarks

**Task filters:** Search by title, filter by status, filter by priority, filter by date range

**Export CSV:** Downloads the current filtered task list as a CSV file

**Task Documents:** Upload/download/delete attachments per task (up to 20 MB per file)

**Role visibility (enforced on the API):**
- Owner, Admin, Sub-Admin, Senior Manager, Managing Partner, Partner → see all company tasks
- Manager-tier roles (manager, audit-manager, tax-manager, compliance-manager) → see only tasks where the assignee is in the same department as the manager
- Associates, executives, assistants, trainees → see only tasks assigned to or created by them

**Pagination:** 20 tasks per page. Prev/Next controls appear when there are more than 20 results. Page resets automatically when filters change.

---

## Deadlines

Two-column layout:
- **Overdue** — tasks past their due date
- **Due This Week** — tasks due in the next 7 days

**Full deadline register table** — all tasks with due dates, sorted by urgency, with a "days left" column showing colour-coded badges (red = overdue, amber = soon, green = ok).

---

## Team Directory

**Grid view** — member cards showing avatar, designation, department, contact icons, active task count, edit/delete buttons

**Hierarchy view** — indented list organised by `reportsTo` reporting lines, showing the org chart structure

**Search** — filters across name, role, department, designation in real time

**Pagination:** 24 members per page in grid view. Prev/Next controls appear when there are more than 24 members.

**Member Detail Drawer** — slides in from the right when clicking a member card. Tabbed:
- **Profile** — all contact and work info
- **Address** — full address fields
- **Emergency Contact** — emergency contact name and phone
- **Documents** — downloadable member documents (ID proof, certificates, etc.)

---

## User Management (Add / Edit Members)

**Add Member modal** — 5-tab form:
1. Account (username, password, name, email, phone, photo)
2. Work (role dropdown with optgroups, department, designation, reports-to, join date)
3. Address (address line, city, state, pin code, country)
4. Emergency Contact (contact name, phone)
5. Documents (upload with document type selector)

**Roles available in dropdown (19 total):**
- Management: Admin, Sub Admin
- Audit: Sr. Manager Audit, Manager Audit, Manager Audit & Accounts, Associate Audit & Accounts, Audit Associate, Executive Audit & Accounts, Audit Assistant
- Compliance: Sr. Manager Compliance, Manager Compliance & Legal, Associate Compliance & Legal, Audit Compliance Associate, Executive Compliance & Legal, Compliance Assistant
- Others: Executive, Associate, Assistant, Trainee

**Edit Profile** — same modal pre-filled with existing data. Includes optional password change.

**Delete** — soft-delete (admin/owner only), with confirmation dialog.

---

## Performance

Three sub-tabs (selection persisted across page navigations):

**Leaderboard**
- Podium cards for top 3 performers (gold/silver/bronze) with completion % and progress bar
- Ranked scorecard grid showing all members with task counts, completion rate, overdue count

**Task Metrics**
- Horizontal completion-rate bars per member, colour-coded (green ≥80%, amber ≥50%, red <50%)
- Overdue-by-member list with danger pills

**Billing**
- Billed vs collected bar chart
- Billing breakdown table showing amount billed, collected, and recovery % per member

**Filters:** Period (This Month / This Quarter / All Time) + Department dropdown — both applied together

---

## Alerts

**Critical alerts** — tasks overdue by more than 7 days

**Warning alerts** — tasks overdue 1–7 days, high-value billing pending

**Team Health KPI scorecard:**
- Completion rate
- Billing recovery rate
- Zero-overdue members count

---

## Notifications

A unified notification bell appears in the topbar for **all users**.

**Badge count:**
- Personal unread notifications + (for admins/managers) open team alerts

**Personal notifications:**
- `task_assigned` — created when a task is assigned to you by someone else (on create or re-assign)
- `deadline_approaching` — automatically created when you fetch notifications if you have a task due within 24 hours that hasn't been completed (one per task per day)

**Team alerts (admins/managers only):** The dropdown also shows critical/warning team-wide alerts (overdue tasks, billing issues) below a divider.

**Actions:**
- Click a notification → marks it read and navigates to the Tasks section
- "Mark all read" button clears the badge for all personal notifications

**Polling:** The Angular `NotificationService` polls `GET /api/notification` every 30 seconds while the dashboard is open.

---

## Activity Feed

Chronological log of all task and user actions across the company.

Each entry shows:
- Coloured icon circle per action type (green = created, red = deleted, blue = updated, purple = moved)
- Who performed the action
- What changed
- When

Activities are auto-logged by the API on all task CRUD operations and status changes.

**Pagination:** 15 entries per page with Prev/Next controls.

---

## Dark Mode

Toggle button in the top bar. Persists via `localStorage` (`tp_theme`).

Implementation: sets `data-theme="dark"` on the `<html>` element. All colours defined as CSS custom properties in `styles.scss` — automatically switch based on `[data-theme="dark"]` selector.

---

## Mobile Responsiveness

The dashboard is responsive across devices:

- **Tablet (≤768px):** Sidebar becomes a hidden overlay — the hamburger button in the topbar slides it in. Stats grid collapses to 2 columns. Tables and Kanban board are horizontally scrollable. Notification dropdown expands to full width.
- **Phone (≤480px):** Stats grid collapses to 1 column. Topbar condenses. Slide-over modals (task, user) go full-screen.

---

## Live Clock

Top bar shows current time (HH:MM:SS) with a pulsing green dot. Updates every second via `setInterval`.

---

## Password Reset Email

Triggered by POST `/api/auth/forgot-password`. Requires these env vars on the Container App:

```
Smtp__Host=smtp.gmail.com
Smtp__Port=587
Smtp__Username=your@gmail.com
Smtp__Password=<gmail-app-password>
Smtp__FromName=TeamPulse
```

For Gmail: use an **App Password** (not your regular Gmail password). Generate at: myaccount.google.com → Security → 2-Step Verification → App passwords.
