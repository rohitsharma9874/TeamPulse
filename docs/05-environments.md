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
| `Owner__Username` | Hidden super-admin username | *(secret — never commit)* |
| `Owner__Password` | Hidden super-admin password | *(secret — never commit)* |
| `Smtp__Host` | SMTP server for password reset emails | `smtp.gmail.com` |
| `Smtp__Port` | SMTP port | `587` |
| `Smtp__Username` | SMTP account email | `your@gmail.com` |
| `Smtp__Password` | Gmail App Password | *(secret — never commit)* |
| `Smtp__FromName` | Display name in emails | `TeamPulse` |

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
| `tp_user` | Serialised user object (id, username, name, role, etc.) |
| `tp_theme` | `dark` or `light` |
| `tp_perf_tab` | Last selected Performance sub-tab |

To force a fresh login, clear both `tp_token` and `tp_user` from DevTools → Application → Session Storage.

---

## Security Rules

1. **Never commit credentials** — `appsettings.Development.json` is in `.gitignore`
2. **SMTP credentials** — env vars on Container App only (`Smtp__Password`)
3. **Owner credentials** — `Owner__Username` and `Owner__Password` env vars only; never in code or git
4. **JWT Secret** — must be at least 32 characters; different per environment recommended
5. **Forgot password endpoint** — always returns 200 regardless of whether email exists (prevents user enumeration)
