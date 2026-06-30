# 05 — Environments

## Three Environments

| | Local | Staging | Production |
|--|-------|---------|-----------|
| **Purpose** | Development | Test before releasing | Live users |
| **Branch** | Any | `develop` | `main` |
| **API** | localhost:5000 | teampulse-api-staging... | teampulse-api... |
| **Angular** | localhost:4200 | teampulsewebstg... | teampulsewebks... |
| **Database** | LocalDB (TeamPulseDb) | Azure SQL (TeamPulseDbStaging) | Azure SQL (TeamPulseDb) |
| **Deploy** | Manual (`dotnet run`) | Auto on `develop` push | Manual approval required |

---

## Full Environment Variable Reference

These are all env vars the API reads from configuration. For local dev they go in `appsettings.Development.json`; for cloud they're set directly on the Container App.

| Variable | Description | Example |
|----------|-------------|---------|
| `ConnectionStrings__DefaultConnection` | SQL Server connection string | `Server=...;Database=TeamPulseDb;...` |
| `Jwt__Secret` | Signing key — minimum 32 characters | `TeamPulseLocalSecretKey123...` |
| `Jwt__Issuer` | JWT issuer claim | `TeamPulseLocal` |
| `Jwt__Audience` | JWT audience claim | `TeamPulseLocal` |
| `AllowedOrigins` | CORS allowed origins (comma-separated) | `https://teampulsewebks.z13.web.core.windows.net` |
| `Owner__Username` | Hidden super-admin username (per tenant) | *(secret — never commit)* |
| `Owner__Password` | Hidden super-admin password (per tenant) | *(secret — never commit)* |
| `PlatformAdmin__Username` | Platform admin username (cross-tenant) | *(secret — never commit)* |
| `PlatformAdmin__Password` | Platform admin password (cross-tenant) | *(secret — never commit)* |
| `App__Url` | Frontend base URL — used to build password reset links | `https://teampulsewebks.z13.web.core.windows.net` |
| `Smtp__Host` | SMTP server for password reset emails | `smtp.gmail.com` |
| `Smtp__Port` | SMTP port | `587` |
| `Smtp__EnableSsl` | Enable TLS | `true` |
| `Smtp__Username` | SMTP account email | `your@gmail.com` |
| `Smtp__Password` | Gmail App Password | *(secret — never commit)* |
| `Smtp__From` | Sender email address | `your@gmail.com` |
| `Smtp__FromName` | Display name in emails | `TeamPulse` |
| `Storage__UploadsPath` | Directory for uploaded files — maps to the Azure File Share mount point | `/mnt/uploads` |

> `__` (double underscore) is the Azure convention for nested config keys (maps to `Jwt:Secret` in .NET).

---

## Angular Environment Files

### `environment.ts` (local dev)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
};
```

### `environment.staging.ts`
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://teampulse-api-staging.yellowisland-4fe46c53.eastus.azurecontainerapps.io/api',
};
```

### `environment.prod.ts`
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://teampulse-api.yellowisland-4fe46c53.eastus.azurecontainerapps.io/api',
};
```

---

## SessionStorage Keys (Browser)

| Key | Value |
|-----|-------|
| `tp_token` | JWT access token |
| `tp_user` | Serialised user object (id, username, name, role, companyId, etc.) |
| `tp_theme` | `dark` or `light` |
| `tp_section` | Last visited dashboard section (e.g. `tasks`, `team`) |
| `tp_overview_tab` | Last selected Overview sub-tab (`pulse`, `workload`, `finances`, `urgent`) |
| `tp_tasks_tab` | Last selected Tasks sub-tab (`list`, `board`, `guide`) |
| `tp_perf_tab` | Last selected Performance sub-tab (`leaderboard`, `metrics`, `billing`) |

To force a fresh login, clear both `tp_token` and `tp_user` from DevTools → Application → Session Storage.

---

## Security Rules

1. **Never commit credentials** — `appsettings.Development.json` is in `.gitignore`
2. **SMTP credentials** — env vars on Container App only (`Smtp__Password`)
3. **Owner credentials** — `Owner__Username` and `Owner__Password` env vars only; never in code or git
4. **Platform admin credentials** — `PlatformAdmin__Username` and `PlatformAdmin__Password` env vars only; never in code or git
5. **JWT Secret** — must be at least 32 characters; different per environment recommended
6. **Forgot password endpoint** — always returns 200 regardless of whether the company code or email is valid (prevents user enumeration)
7. **Tenant isolation** — EF Core global query filters enforce `CompanyId` scoping at the DB layer; no controller needs to manually add `WHERE CompanyId = ?`
