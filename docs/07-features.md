# 07 — Features

## Authentication

**Login** (`/login`)
- Username + password login with BCrypt verification
- Returns JWT token (8-hour expiry) + user object
- Token stored in `sessionStorage` (`tp_token`)
- 30-minute inactivity timeout — auto-logout after idle

**Forgot Password** (`/forgot-password`)
- User enters email address
- Always returns 200 regardless of whether email is registered (prevents user enumeration)
- Sends password reset link if email matches a user
- Requires SMTP configured via env vars

**Reset Password** (`/reset-password?token=...`)
- User arrives via emailed link with a time-limited token
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

**Task filters:** Search by title, filter by status, filter by priority

**Export CSV:** Downloads the current filtered task list as a CSV file

**Task Documents:** Upload/download/delete attachments per task (up to 20 MB per file)

**Role visibility:**
- Tier 1–3 + Owner → see all company tasks
- Tier 4–5 → see only tasks assigned to or created by them

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

## Activity Feed

Chronological log of all task and user actions across the company.

Each entry shows:
- Coloured icon circle per action type (green = created, red = deleted, blue = updated, purple = moved)
- Who performed the action
- What changed
- When

Activities are auto-logged by the API on all task CRUD operations and status changes.

---

## Dark Mode

Toggle button in the top bar. Persists via `localStorage` (`tp_theme`).

Implementation: sets `data-theme="dark"` on the `<html>` element. All colours defined as CSS custom properties in `styles.scss` — automatically switch based on `[data-theme="dark"]` selector.

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
