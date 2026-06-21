# 08 — Roles & Permissions

## Role Hierarchy

Lower rank number = more senior / more permissions.

| Rank | Role value | Display label | Tier |
|------|-----------|--------------|------|
| 0 | `owner` | Owner | 1 (full access) |
| 1 | `admin` | Admin | 1 |
| 2 | `sub-admin` | Sub Admin | 1 |
| 3 | `senior-manager` | Senior Manager | 2 |
| 3 | `senior_manager_audit` | Sr. Manager Audit | 2 |
| 3 | `senior_manager_compliance` | Sr. Manager Compliance | 2 |
| 4 | `manager_audit` | Manager Audit | 3 |
| 4 | `manager_audit_accounts` | Manager Audit & Accounts | 3 |
| 4 | `manager_compliance_legal` | Manager Compliance & Legal | 3 |
| 5 | `associate` | Associate | 4 |
| 5 | `associate_audit_accounts` | Associate Audit & Accounts | 4 |
| 5 | `associate_compliance_legal` | Associate Compliance & Legal | 4 |
| 6 | `audit_associate` | Audit Associate | 4 |
| 6 | `audit_compliance_associate` | Audit Compliance Associate | 4 |
| 7 | `executive` | Executive | 5 |
| 7 | `executive_audit_accounts` | Executive Audit & Accounts | 5 |
| 7 | `executive_compliance_legal` | Executive Compliance & Legal | 5 |
| 8 | `assistant` | Assistant | 5 |
| 8 | `audit_assistant` | Audit Assistant | 5 |
| 8 | `compliance_assistant` | Compliance Assistant | 5 |
| 9 | `trainee` | Trainee | 5 |

---

## Permission Matrix (by Tier)

| Permission | Tier 1 (Owner/Admin) | Tier 2 (Sr. Manager) | Tier 3 (Manager) | Tier 4 (Associate) | Tier 5 (Staff) |
|-----------|---------------------|---------------------|-----------------|-------------------|----------------|
| View Performance tab | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Alerts tab | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Activity Feed | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Team Directory | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create tasks | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit tasks | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete tasks | ✅ | ✅ | ❌ | ❌ | ❌ |
| View all tasks | ✅ | ✅ | ✅ | ❌ (own only) | ❌ (own only) |
| Export CSV | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Billing tab | ✅ | ✅ | ✅ | ❌ | ❌ |
| Add member | ✅ | ❌ | ❌ | ❌ | ❌ |
| Remove member | ✅ | ❌ | ❌ | ❌ | ❌ |
| Full overview | ✅ | ✅ | ✅ | ❌ | ❌ |
| See early stage columns | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## API-Level Role Checks

> **Important:** The role strings in the API HashSets use a different naming convention than the roles created through the Add Member UI. The API uses generic hyphenated names (`senior-manager`, `audit-manager`) while the frontend ROLE_GROUPS uses specific underscore names (`senior_manager_audit`, `manager_audit`). A user created via the UI with role `manager_audit` would be treated as a tier-4 associate by the API (not found in WriteTaskRoles), and would only see their own tasks. This is a known inconsistency. Use `admin` or `sub-admin` for full management access.

### TaskController

| Action | Allowed roles |
|--------|--------------|
| GET all tasks | Any authenticated (filtered by role for non-managers) |
| POST task | owner, admin, sub-admin, senior-manager, managing-partner, partner, manager, audit-manager, tax-manager, compliance-manager |
| PUT task | Same as POST |
| DELETE task | owner, admin, sub-admin, senior-manager, managing-partner, partner |

### UserController

| Action | Allowed roles |
|--------|--------------|
| GET all users | Any authenticated |
| POST user (create) | owner, admin, sub-admin |
| PUT user (update self) | Self always allowed |
| PUT user (update others) | owner, admin, sub-admin |
| DELETE user | owner, admin, sub-admin |

### PaymentTransactionController

| Action | Allowed roles |
|--------|--------------|
| GET transactions | Any authenticated |
| POST/PUT transaction | owner, admin, sub-admin, senior-manager, managing-partner, partner, manager, audit-manager, tax-manager, compliance-manager |

### ActivityController

| Action | Allowed roles |
|--------|--------------|
| GET/POST activity | Any authenticated |

---

## The Owner Account

The owner is a hidden super-admin account that:
- Has rank 0 (above all other roles)
- Can never be created through the UI — only via env vars at Container App startup
- Has every permission in the system
- Does appear in Team Directory (GET /api/user returns all users including owner); there is no UI-level filter for the owner role

**Setup:** Set these on the Container App:
```
Owner__Username=<your-chosen-username>
Owner__Password=<your-chosen-password>
```

On startup, `SeedAsync` in `Program.cs` reads these env vars and creates the owner user if it doesn't exist. If the env vars are not set, no owner account is created.

**Important:** Keep these credentials private. They give unrestricted access to the entire application and all data.

---

## Adding a New Role

If a new role needs to be added to the system:

**Backend** (`TeamPulse.API/TeamPulse.Infrastructure/...`):
1. Add the role string to the appropriate `HashSet` in `TaskController.cs`, `UserController.cs`, `PaymentTransactionController.cs`

**Frontend** (`TeamPulse.Angular/src/app/core/models/user.model.ts`):
1. Add to `ROLE_HIERARCHY` with appropriate rank number
2. Add to `ROLE_LABELS` with display label
3. Add to `ROLE_GROUPS` under the appropriate group (so it appears in the Add Member modal)
4. Add to `DESIGNATIONS` if a new designation is needed
