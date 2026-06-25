# 04 — CI/CD Pipeline

## Overview

Two GitHub Actions workflows handle build validation and deployment for both the API and Angular app.

```
Feature branch
      │
      ▼  Pull Request → develop
   develop ──── push ────► Staging auto-deploys (no approval)
                                │
                     Test on staging ✓
                                │
                      Pull Request → main
                                │
                     main ──── push ────► Production (requires manual approval)
```

---

## Branching Strategy

| Branch | Purpose | Deploys to |
|--------|---------|-----------|
| `feature/*` | New features / bug fixes | — |
| `develop` | Integration branch — tested regularly | Staging (auto) |
| `main` | Production-ready code only | Production (after approval) |

**Rule:** Never push directly to `main`. All changes go through `develop` first, then PR to `main`.

---

## Workflow: API (`api.yml`)

**Trigger:**
- `push` to `develop` or `main` (paths: `TeamPulse.Api/**`)
- `pull_request` to `develop` or `main` (paths: `TeamPulse.Api/**`)

**Jobs:**

| Job | Runs when | Environment | What it does |
|-----|-----------|-------------|-------------|
| `Build` | Always | — | `dotnet build` — validates code compiles |
| `Deploy → Staging` | Push to `develop` | `staging` | Docker build → push to ACR → update `teampulse-api-staging` |
| `Deploy → Production` | Push to `main` | `production` | Docker build → push to ACR → update `teampulse-api` |

**Docker image tags:**
- Staging: `teampulseacrks.azurecr.io/teampulse-api:staging-{git-sha}`
- Production: `teampulseacrks.azurecr.io/teampulse-api:{git-sha}`

---

## Workflow: Angular (`angular.yml`)

**Trigger:**
- `push` to `develop` or `main` (paths: `TeamPulse.Angular/**`)
- `pull_request` to `develop` or `main` (paths: `TeamPulse.Angular/**`)

**Jobs:**

| Job | Runs when | Config used | Deploys to |
|-----|-----------|-------------|-----------|
| `Build` | Always (push + PR) | `production` | — (validation only) |
| `Deploy → Staging` | Push to `develop` | `staging` | `teampulsewebstg` blob storage `$web` |
| `Deploy → Production` | Push to `main` | `production` | `teampulsewebks` blob storage `$web` |

Angular builds with different `environment.*.ts` files per environment. The staging build points to the staging API URL; production build points to the production API URL.

---

## GitHub Environments

### Setting up environments

Go to: `github.com/rohitsharma9874/TeamPulse → Settings → Environments`

#### `staging` environment
- Click **New environment** → name: `staging`
- No protection rules needed
- Add secrets:
  - `AZURE_CREDENTIALS` — service principal JSON
  - `ACR_USERNAME` — `teampulseacrks`
  - `ACR_PASSWORD` — from ACR Access Keys

#### `production` environment
- Add **Required reviewers**: `rohitsharma9874`
- Under **Deployment branches**: restrict to `main` branch only
- Add same 3 secrets as staging

> Secrets are stored at the **environment level** (not repository level). Each environment has its own copy of the 3 secrets.

---

## GitHub Secrets Reference

| Secret | Where | Value |
|--------|-------|-------|
| `AZURE_CREDENTIALS` | Both environments | JSON from `az ad sp create-for-rbac` |
| `ACR_USERNAME` | Both environments | `teampulseacrks` |
| `ACR_PASSWORD` | Both environments | From `az acr credential show --name teampulseacrks` |

---

## How Production Approval Works

1. PR is merged `develop → main`
2. GitHub Actions starts the production pipeline
3. `Build` job runs and passes
4. `Deploy → Production` job reaches the `production` environment gate — **pauses**
5. GitHub sends an email to `rohitsharma9874`
6. Go to: `github.com/rohitsharma9874/TeamPulse → Actions → [the run] → Review deployments`
7. Click **Approve** → production deployment proceeds
8. Deployment takes ~5 minutes

---

## First-Time Pipeline Run — Prerequisites

The pipelines assume the Azure resources already exist. If you run the pipeline before creating the Container Apps or storage accounts, the deploy jobs will fail.

**Order of operations for a fresh setup:**
1. Create all Azure resources (see [03-azure-infrastructure.md](03-azure-infrastructure.md))
2. Attach ACR credentials to both Container Apps (`az containerapp registry set`)
3. Add GitHub environment secrets to both `staging` and `production` environments
4. Then push to `develop` to trigger the first staging deploy

---

## Re-triggering a Deployment Without Code Changes

If you need to force a redeploy (e.g. after fixing Container App env vars):

```bash
# Empty commit to trigger pipeline
git commit --allow-empty -m "ci: trigger redeploy" && git push origin develop
```

Or manually re-run the workflow from GitHub Actions UI:
`Actions → [workflow name] → Re-run jobs`

---

## Adding New Environment Variables to Container App

Environment variables are **not** managed by the CI/CD pipeline — they're set directly on the Container App and persist across deployments.

```powershell
# Add/update env vars (does not overwrite others)
az containerapp update `
  --name teampulse-api `
  --resource-group teampulse-rg `
  --set-env-vars "NEW_VAR=value"
```

---

## Key Build Notes

### API
- Uses `dotnet build --configuration Release`
- Docker multi-stage build: SDK image to compile, runtime image for final container
- `dotnet publish /p:UseAppHost=false` produces framework-dependent output

### Angular
- `npm ci --legacy-peer-deps` (needed due to Angular 22 peer dependency strictness)
- `NODE_OPTIONS=--max-old-space-size=4096` required for large builds
- `inlineCritical: false` in `angular.json` — required to prevent Chart.js JSDOM crash during esbuild optimization
- `withHashLocation()` in router — required for Azure Blob Storage SPA routing (no server-side URL rewrite)
- Output hashing enabled — each build produces unique filenames, ensuring browsers load fresh code
