# 08 — Roles & Permissions

## Role Hierarchy

Lower rank number = more senior / more permissions.

| Rank | Role value | Display label | Tier |
|------|-----------|--------------|------|
| — | `platform-admin` | Platform Admin | Platform (cross-tenant) |
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
| View all tasks | ✅ | ✅ | ⚠️ dept only | ❌ (own only) | ❌ (own only) |
| Export CSV | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Billing tab | ✅ | ✅ | ✅ | ❌ | ❌ |
| Add member | ✅ | ❌ | ❌ | ❌ | ❌ |
| Remove member | ✅ | ❌ | ❌ | ❌ | ❌ |
| Full overview | ✅ | ✅ | ✅ | ❌ | ❌ |
| See early stage columns | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## API-Level Role Checks

> **Note on role naming:** The API uses hyphenated role names (`senior-manager`, `audit-manager`, `compliance-manager`) while the frontend `ROLE_GROUPS` uses underscore names (`senior_manager_audit`, `manager_audit`). Users created through the Add Member UI receive the underscore variants. The API's `ManagerRoles` and `AllTaskRoles` sets check with `OrdinalIgnoreCase`, so minor case differences are handled, but the hyphen/underscore difference means a user with role `manager_audit` will not be found in `ManagerRoles` and will fall through to associate-level access (own tasks only). Use `audit-manager` (hyphenated) when creating manager-tier users through the API or direct DB seed.

### TaskController

| Action | Allowed roles |
|--------|--------------|
| GET all tasks | Any authenticated; visibility filtered by role (see below) |
| POST task | owner, admin, sub-admin, senior-manager, managing-partner, partner, manager, audit-manager, tax-manager, compliance-manager |
| PUT task | Same as POST |
| DELETE task | owner, admin, sub-admin, senior-manager, managing-partner, partner |

**GET task visibility rules:**
- `AllTaskRoles` (see everything): owner, admin, sub-admin, senior-manager, managing-partner, partner
- `ManagerRoles` (department scope): manager, audit-manager, tax-manager, compliance-manager — tasks where the assignee shares the manager's department
- All other roles: tasks assigned to or created by themselves only

### NotificationController

| Action | Allowed roles |
|--------|--------------|
| GET notifications | Any authenticated (personal scope — own userId) |
| PATCH /{id}/read | Any authenticated (own notifications only) |
| PATCH /read-all | Any authenticated (own notifications only) |

### TenantController

| Action | Allowed roles |
|--------|--------------|
| All tenant CRUD | `platform-admin` only |

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

## The Platform Admin Account

The platform admin is a cross-tenant super-admin that manages all tenants:
- Has role `platform-admin` and `companyId = PLATFORM`
- Can never be created through the tenant UI — only via env vars at startup
- Bypasses all EF Core tenant query filters
- Accesses the Platform Admin Panel at `/platform-admin`
- Is filtered out of every tenant's user lists (never returned by `/api/user`)

**Setup:** Set these on the Container App:
```
PlatformAdmin__Username=<your-chosen-username>
PlatformAdmin__Password=<your-chosen-password>
```

On startup, `SeedAsync` reads these env vars and creates the platform-admin user under the PLATFORM tenant if it doesn't exist. If the env vars are not set, no platform-admin is created.

---

## The Owner Account

The owner is a hidden super-admin account within a specific tenant that:
- Has rank 0 (above all other roles)
- Can never be created through the UI — only via env vars at Container App startup
- Has every permission in the system
- Is filtered out of the Team Directory and all UI user lists — the dashboard filters `role === 'owner'` client-side after the API response

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
