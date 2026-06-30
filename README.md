# TeamPulse

A multi-tenant team management SaaS platform for professional practices. Built with ASP.NET Core 10 (API) and Angular 19 (frontend), deployed on Azure Container Apps.

## Project Structure

```
TeamPulse/
├── TeamPulse.API/          # ASP.NET Core 10 Web API
│   ├── TeamPulse.Domain/
│   ├── TeamPulse.Application/
│   ├── TeamPulse.Infrastructure/
│   └── TeamPulse.WebApi/
├── TeamPulse.Angular/      # Angular 19 frontend
├── Specs/                  # Product specification documents
├── docs/                   # Developer documentation
└── .github/workflows/      # CI/CD pipelines (api.yml, angular.yml)
```

## Documentation

All developer docs are in the [`docs/`](docs/) folder:

| File | Contents |
|------|----------|
| [01-project-overview.md](docs/01-project-overview.md) | Architecture, tech stack, key design decisions |
| [02-local-development.md](docs/02-local-development.md) | Local setup, running API and Angular |
| [03-azure-infrastructure.md](docs/03-azure-infrastructure.md) | Azure resources, one-time setup commands |
| [04-cicd-pipeline.md](docs/04-cicd-pipeline.md) | GitHub Actions workflows, branching strategy |
| [05-environments.md](docs/05-environments.md) | Environment variables, Angular env files |
| [06-deployment.md](docs/06-deployment.md) | How to deploy manually |
| [07-features.md](docs/07-features.md) | Feature inventory with implementation notes |
| [08-roles-permissions.md](docs/08-roles-permissions.md) | Role hierarchy and access control |
| [09-troubleshooting.md](docs/09-troubleshooting.md) | Common issues and fixes |
| [10-quick-reference.md](docs/10-quick-reference.md) | Commands, URLs, and secrets cheat-sheet |

## Quick Start (Local)

### API

```bash
cd TeamPulse.API
dotnet run --project TeamPulse.WebApi
# Runs at https://localhost:5000
```

Requires `appsettings.Development.json` (git-ignored) with local connection string, JWT secret, and SMTP credentials.

### Angular

```bash
cd TeamPulse.Angular
npm ci --legacy-peer-deps
ng serve
# Runs at http://localhost:4200
```

## Git Workflow

| Branch | Purpose | Deploys to |
|--------|---------|-----------|
| `feature/*` | New features / bug fixes | — |
| `develop` | Integration branch | Staging (auto) |
| `main` | Production-ready code | Production (manual approval) |

Never push directly to `main`. All changes go through `develop` first, then a PR to `main`.

## Environments

| | Staging | Production |
|-|---------|-----------|
| **API** | `teampulse-api-staging.yellowisland-4fe46c53.eastus.azurecontainerapps.io` | `teampulse-api.yellowisland-4fe46c53.eastus.azurecontainerapps.io` |
| **Angular** | `teampulsewebstg.z13.web.core.windows.net` | `teampulsewebks.z13.web.core.windows.net` |
| **Database** | `TeamPulseDbStaging` | `TeamPulseDb` |
| **File Uploads** | Azure File Share `tp-staging-uploads` | Azure File Share `tp-prod-uploads` |
