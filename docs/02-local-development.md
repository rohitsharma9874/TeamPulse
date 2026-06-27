# 02 — Local Development

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| .NET SDK | 10.0 | https://dotnet.microsoft.com/download |
| Node.js | 22.x (via nvm-windows) | `nvm use 22` |
| SQL Server | LocalDB | Installed with Visual Studio or standalone |
| Angular CLI | Latest | `npm install -g @angular/cli` |
| Git | Any | |

---

## Running the API Locally

```bash
# 1. Navigate to the WebApi project
cd TeamPulse.API/TeamPulse.WebApi

# 2. Ensure appsettings.Development.json has a connection string:
# (this file is git-ignored — create it if missing)
```

Create `TeamPulse.API/TeamPulse.WebApi/appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=TeamPulseDb;Trusted_Connection=True;"
  },
  "Jwt": {
    "Secret": "TeamPulseLocalSecretKey123456789_ReplaceInProduction_MinimumLength32",
    "Issuer": "TeamPulseLocal",
    "Audience": "TeamPulseLocal"
  },
  "App": {
    "Url": "http://localhost:4200"
  },
  "PlatformAdmin": {
    "Username": "platformadmin",
    "Password": "platformpass123"
  }
}
```

```bash
# 3. Run — EF migrations + seed data run automatically on startup
dotnet run
```

API starts at **http://localhost:5000**  
Scalar API docs at **http://localhost:5000/scalar/v1**

### Seed Data Created Automatically

**Tenants:**

| Tenant ID | Name | Notes |
|-----------|------|-------|
| `PLATFORM` | TeamPulse Platform | Parent company — always seeded |
| `KPA001` | KPA & Co. | Demo tenant — always seeded |

**Users:**

| Company Code | Username | Password | Role | Name |
|---|----------|----------|------|------|
| `PLATFORM` | *(from `PlatformAdmin__Username` env var)* | *(from env var)* | platform-admin | Platform Admin |
| `KPA001` | admin | password | admin | Koshal Sharma |
| `KPA001` | srmanager | password | senior-manager | Priya Mehta |
| `KPA001` | trainee | password | trainee | Ravi Kumar |

> The platform-admin account is only seeded if `PlatformAdmin__Username` and `PlatformAdmin__Password` are set in config or env vars.

### Logging In (Local)

The login form requires a **Company Code** as the first field.

- For KPA001 users: enter `KPA001` as the company code
- For platform admin: enter `PLATFORM` as the company code

---

## Running Angular Locally

```bash
# 1. Install dependencies
cd TeamPulse.Angular
npm install --legacy-peer-deps

# 2. Start dev server (proxies /api to localhost:5000)
npx ng serve
```

Angular starts at **http://localhost:4200**

The default `environment.ts` points API at `http://localhost:5000/api`.

---

## Environment Files

| File | Used when | API URL |
|------|-----------|---------|
| `src/environments/environment.ts` | `ng serve` (local dev) | `http://localhost:5000/api` |
| `src/environments/environment.staging.ts` | `ng build --configuration staging` | Staging Container App URL |
| `src/environments/environment.prod.ts` | `ng build --configuration production` | Production Container App URL |

---

## Running EF Migrations Manually

Install the EF Core CLI tool first if you haven't already:
```bash
dotnet tool install --global dotnet-ef
```

```bash
cd TeamPulse.API

# Add a new migration
dotnet ef migrations add <MigrationName> \
  --project TeamPulse.Infrastructure \
  --startup-project TeamPulse.WebApi

# Apply migrations
dotnet ef database update \
  --project TeamPulse.Infrastructure \
  --startup-project TeamPulse.WebApi
```

---

## Building the Docker Image Locally

```bash
cd TeamPulse.API
docker build -t teampulse-api:local .
docker run -p 8080:8080 \
  -e ConnectionStrings__DefaultConnection="<your-connection-string>" \
  -e Jwt__Secret="<your-secret>" \
  -e Jwt__Issuer="TeamPulseLocal" \
  -e Jwt__Audience="TeamPulseLocal" \
  teampulse-api:local
```

---

## Important Notes

- `appsettings.Development.json` is git-ignored. Never put credentials in `appsettings.json`.
- SMTP credentials for password reset go in `appsettings.Development.json` under `Smtp__Password` — never committed.
- The API uses port `5000` locally (set via `launchSettings.json`), but `8080` inside Docker containers.
