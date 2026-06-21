# TeamPulse — Documentation Index

**TeamPulse** is a workforce intelligence platform built for **KPA & Co.**, a CA firm. It provides task management, team performance tracking, billing oversight, and compliance monitoring.

---

## Documents

| # | File | What it covers |
|---|------|----------------|
| 1 | [Project Overview](01-project-overview.md) | Architecture, tech stack, entities, role hierarchy |
| 2 | [Local Development](02-local-development.md) | Prerequisites, running API + Angular locally |
| 3 | [Azure Infrastructure](03-azure-infrastructure.md) | Every Azure resource, creation commands, configuration |
| 4 | [CI/CD Pipeline](04-cicd-pipeline.md) | GitHub Actions workflows, branching strategy, secrets |
| 5 | [Environments](05-environments.md) | Local / Staging / Production config, env vars reference |
| 6 | [Deployment Guide](06-deployment.md) | Day-to-day deploy workflow, how approvals work |
| 7 | [Features](07-features.md) | Every feature, what it does, which roles can access it |
| 8 | [Roles & Permissions](08-roles-permissions.md) | Full role hierarchy, permission matrix, owner account |
| 9 | [Troubleshooting](09-troubleshooting.md) | Known issues, past fixes, diagnostic commands |

---

## Live URLs

| Environment | Angular App | API |
|-------------|-------------|-----|
| **Production** | https://teampulsewebks.z13.web.core.windows.net/#/login | https://teampulse-api.yellowisland-4fe46c53.eastus.azurecontainerapps.io |
| **Staging** | https://teampulsewebstg.z13.web.core.windows.net/#/login | https://teampulse-api-staging.yellowisland-4fe46c53.eastus.azurecontainerapps.io |

## Repository

https://github.com/rohitsharma9874/TeamPulse

---

## Seed Credentials (non-production use only)

| Username | Password | Role |
|----------|----------|------|
| admin | password | Admin |
| srmanager | password | Senior Manager |
| trainee | password | Trainee |

> Owner account credentials are supplied via Azure Container App env vars only — never committed to git.
