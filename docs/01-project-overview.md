# 01 — Project Overview

## What is TeamPulse?

TeamPulse is a **multi-tenant** workforce intelligence SaaS platform. The **PLATFORM** tenant (parent company) provisions and manages independent company tenants. Each tenant is a Chartered Accountancy firm or similar professional services organisation that tracks tasks, deadlines, team performance, billing recovery, and compliance work across audit, tax, and compliance teams.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | .NET 10, Clean Architecture (4 projects) |
| ORM | Entity Framework Core 10, SQL Server |
| Auth | JWT Bearer tokens, BCrypt password hashing |
| API Docs | Scalar (replaces Swagger) at `/scalar/v1` |
| Frontend | Angular 22, standalone components, lazy loading |
| CSS | SCSS with CSS custom properties (dark/light theme) |
| Charts | Chart.js |
| Build | `@angular/build:application` (esbuild) |
| Container | Docker (mcr.microsoft.com/dotnet/aspnet:10.0) |
| Cloud | Azure (Container Apps + Blob Storage + SQL + ACR) |

---

## Solution Structure

```
TeamPulse/
├── TeamPulse.API/                    # Backend (.NET 10)
│   ├── TeamPulse.Domain/             # Entities only — no dependencies
│   ├── TeamPulse.Application/        # Interfaces, DTOs, business logic
│   ├── TeamPulse.Infrastructure/     # EF Core, repositories, services
│   ├── TeamPulse.WebApi/             # Controllers, Program.cs, Dockerfile
│   └── Dockerfile
├── TeamPulse.Angular/                # Frontend (Angular 22)
│   └── src/
│       ├── app/
│       │   ├── core/                 # Guards, interceptors, services, models
│       │   └── features/             # Login, Dashboard (all features inside)
│       └── environments/             # environment.ts / .staging.ts / .prod.ts
├── .github/workflows/
│   ├── api.yml                       # API CI/CD pipeline
│   └── angular.yml                   # Angular CI/CD pipeline
└── docs/                             # This documentation
```

---

## Domain Entities

| Entity | Key Fields |
|--------|-----------|
| `Tenant` | Id (company code e.g. `KPA001`), Name, Tagline, LogoUrl, IsActive, CreatedAt |
| `User` | Id, Username, PasswordHash, Name, Email, Role, Department, CompanyId, ReportsTo, Designation, Gender, DateOfBirth, JoinDate, Address fields, EmergencyContact |
| `TaskItem` | Id, Title, Description, AssigneeId, CreatedByUserId, Priority, Status, DueDate, ClientContact, BillingDetails, PaymentStatus, Remarks, CompanyId, CompletedAt |
| `Notification` | Id, UserId, CompanyId, Type (task_assigned \| deadline_approaching), Message, TaskId, IsRead, CreatedAt |
| `AuditLog` | Id, CompanyId, ChangedBy, EntityType, EntityId, Action, NewValue, OldValue, ChangedAt |
| `TaskDocument` | Id, TaskId, StoredName, OriginalName, ContentType, FileSize, CompanyId, UploadedBy |
| `MemberDocument` | Id, UserId, DocumentType, StoredName, OriginalName, ContentType, FileSize, CompanyId |
| `PaymentTransaction` | Id, TaskId, Amount, PaymentDate, Method, Notes, CompanyId |

`Tenant` has no soft delete. All other entities have `IsDeleted` (soft delete) and `CompanyId` for tenant isolation. EF Core global query filters enforce tenant isolation automatically from the JWT `companyId` claim.

---

## API Endpoints

Base URL: `/api`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/login` | Login with company code + credentials, returns JWT + user | Public |
| POST | `/auth/forgot-password` | Sends reset email scoped to tenant (always 200) | Public |
| POST | `/auth/reset-password` | Resets password via token | Public |
| GET | `/config?tenantId=X` | Returns tenant branding (name, tagline, logoUrl) | Public |
| GET | `/tenant` | List all tenants with user count | platform-admin only |
| POST | `/tenant` | Create tenant + first admin user | platform-admin only |
| PUT | `/tenant/{id}` | Update tenant branding | platform-admin only |
| PATCH | `/tenant/{id}/toggle` | Toggle tenant active/inactive | platform-admin only |
| GET | `/notification` | Personal notifications (lazily creates deadline alerts) | Any role |
| PATCH | `/notification/{id}/read` | Mark one notification as read | Any role |
| PATCH | `/notification/read-all` | Mark all notifications as read | Any role |
| GET | `/user` | List all users in company | Any role |
| POST | `/user` | Create new user | Admin/Sub-Admin/Owner |
| PUT | `/user/{id}` | Update profile | Self or Admin/Owner |
| DELETE | `/user/{id}` | Soft-delete user | Admin/Sub-Admin/Owner |
| GET | `/task` | List tasks (filtered by role tier and department) | Any role |
| POST | `/task` | Create task | Tier 1–3 + Owner |
| PUT | `/task/{id}` | Update task | Tier 1–3 + Owner |
| DELETE | `/task/{id}` | Delete task | Tier 1–2 + Owner |
| GET | `/activity` | List activity logs | Any role |
| POST | `/activity` | Log activity entry | Any role |
| POST | `/attachment/{taskId}` | Upload task document | Any role |
| GET | `/attachment/task/{taskId}` | List task documents | Any role |
| GET | `/attachment/{id}/download` | Download document | Any role |
| DELETE | `/attachment/{id}` | Delete document | Any role |
| POST | `/member-document/{userId}` | Upload member proof doc | Any role |
| GET | `/member-document/user/{userId}` | List member documents | Any role |
| GET | `/member-document/{id}/download` | Download member document | Any role |
| DELETE | `/member-document/{id}` | Delete member document | Any role |
| GET | `/payment-transaction` | List transactions | Any role |
| POST | `/payment-transaction` | Add transaction | Tier 1–3 + Owner |
| GET | `/health` | Health check (also used as pre-warm ping) | Public |

---

## Design System

- **Primary**: Navy `#1B3A6B`
- **Accent**: Gold `#C9A84C`
- **Theme**: Dark/Light via `data-theme` attribute on `<html>`, CSS `var()` throughout
- **Fonts**: System sans-serif
- **Routing**: Hash-based (`/#/dashboard`) for Azure Blob Storage compatibility
