# 03 — Azure Infrastructure

## Resource Summary

| Resource | Name | Type | Region |
|----------|------|------|--------|
| Resource Group | `teampulse-rg` | Resource Group | East US |
| Container Registry | `teampulseacrks` | ACR (Basic) | East US |
| Container Apps Env | `teampulse-env` | Consumption plan | East US |
| API (Production) | `teampulse-api` | Container App | East US |
| API (Staging) | `teampulse-api-staging` | Container App | East US |
| SQL Server | `teampulse-sqlsrv` | Azure SQL Server | Central India |
| DB (Production) | `TeamPulseDb` | Azure SQL (Basic) | Central India |
| DB (Staging) | `TeamPulseDbStaging` | Azure SQL (Basic) | Central India |
| Storage (Angular Prod) | `teampulsewebks` | StorageV2 (LRS) | East US |
| Storage (Angular Staging) | `teampulsewebstg` | StorageV2 (LRS) | East US |
| Storage (File Uploads) | `teampulsestoreks` | StorageV2 (LRS) | East US |

---

## One-Time Setup Commands

Run these in Azure CLI or Azure Cloud Shell. Login first:

```bash
az login
az account set --subscription "<your-subscription-id>"
```

### Register Resource Providers

```bash
az provider register --namespace Microsoft.App --wait
az provider register --namespace Microsoft.ContainerRegistry --wait
az provider register --namespace Microsoft.Storage --wait
az provider register --namespace Microsoft.Sql --wait
az provider register --namespace Microsoft.Web --wait
```

### Resource Group

```bash
az group create --name teampulse-rg --location eastus
```

### Azure Container Registry (ACR)

```bash
az acr create \
  --name teampulseacrks \
  --resource-group teampulse-rg \
  --sku Basic \
  --admin-enabled true
```

Get credentials (needed for GitHub secrets):
```bash
az acr credential show --name teampulseacrks --resource-group teampulse-rg
# username = teampulseacrks
# use password or password2 as ACR_PASSWORD
```

### Container Apps Environment

```bash
az containerapp env create \
  --name teampulse-env \
  --resource-group teampulse-rg \
  --location eastus
```

### SQL Server & Databases

```bash
# SQL Server
az sql server create \
  --name teampulse-sqlsrv \
  --resource-group teampulse-rg \
  --location centralindia \
  --admin-user <sql-admin-username> \
  --admin-password <sql-admin-password>

# Allow Azure services to connect (Container Apps → SQL)
az sql server firewall-rule create \
  --resource-group teampulse-rg \
  --server teampulse-sqlsrv \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Production database
az sql db create \
  --resource-group teampulse-rg \
  --server teampulse-sqlsrv \
  --name TeamPulseDb \
  --edition Basic

# Staging database
az sql db create \
  --resource-group teampulse-rg \
  --server teampulse-sqlsrv \
  --name TeamPulseDbStaging \
  --edition Basic
```

### Allow Your Local Machine to Connect (for SSMS)

Each developer's IP must be whitelisted to connect to the SQL server from SSMS.

```powershell
# Find your public IP first: https://whatismyip.com
az sql server firewall-rule create `
  --resource-group teampulse-rg `
  --server teampulse-sqlsrv `
  --name MyOfficeIP `
  --start-ip-address <your-public-ip> `
  --end-ip-address <your-public-ip>
```

To list existing firewall rules:
```powershell
az sql server firewall-rule list `
  --resource-group teampulse-rg `
  --server teampulse-sqlsrv `
  -o table
```

> The Azure Portal also shows a prompt "Add your client IP" when you try to connect — clicking it auto-adds your current IP.

### SSMS Connection Settings

Open SSMS → Connect → use these settings:

| Field | Value |
|-------|-------|
| Server name | `teampulse-sqlsrv.database.windows.net` |
| Authentication | SQL Server Authentication |
| Login | `<sql-admin-username>` |
| Password | `<sql-admin-password>` |
| Encrypt | Mandatory |
| Trust server certificate | No (unchecked) |

Select the database (`TeamPulseDb` or `TeamPulseDbStaging`) from the dropdown after connecting.

---

## Production Container App

```bash
az containerapp create \
  --name teampulse-api \
  --resource-group teampulse-rg \
  --environment teampulse-env \
  --image mcr.microsoft.com/dotnet/aspnet:10.0 \
  --target-port 8080 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 2 \
  --env-vars \
    "ConnectionStrings__DefaultConnection=Server=teampulse-sqlsrv.database.windows.net;Database=TeamPulseDb;User Id=<sql-admin>;Password=<sql-password>;Encrypt=True;TrustServerCertificate=False" \
    "Jwt__Secret=<long-random-secret-min-32-chars>" \
    "Jwt__Issuer=TeamPulseLocal" \
    "Jwt__Audience=TeamPulseLocal" \
    "AllowedOrigins=https://teampulsewebks.z13.web.core.windows.net" \
    "App__Url=https://teampulsewebks.z13.web.core.windows.net" \
    "Owner__Username=<owner-username>" \
    "Owner__Password=<owner-password>" \
    "PlatformAdmin__Username=<platform-admin-username>" \
    "PlatformAdmin__Password=<platform-admin-password>"
```

Production API URL: `https://teampulse-api.yellowisland-4fe46c53.eastus.azurecontainerapps.io`

### Step 2 — Attach ACR credentials to the Container App

After creation the Container App uses the placeholder .NET base image. Before the CI/CD pipeline can push and pull a real image, set the ACR credentials:

```powershell
az containerapp registry set `
  --name teampulse-api `
  --resource-group teampulse-rg `
  --server teampulseacrks.azurecr.io `
  --username teampulseacrks `
  --password <acr-password>
```

Get `<acr-password>` from:
```powershell
az acr credential show --name teampulseacrks --resource-group teampulse-rg --query "passwords[0].value" -o tsv
```

### Step 3 — Verify environment variables are set

```powershell
az containerapp show `
  --name teampulse-api `
  --resource-group teampulse-rg `
  --query "properties.template.containers[0].env" `
  -o table
```

All expected variables should appear: `ConnectionStrings__DefaultConnection`, `Jwt__Secret`, `Jwt__Issuer`, `Jwt__Audience`, `AllowedOrigins`, `App__Url`, `Owner__Username`, `Owner__Password`, `PlatformAdmin__Username`, `PlatformAdmin__Password`, `Storage__UploadsPath`, plus any SMTP vars.

### Step 4 — Update a specific environment variable

```powershell
# Update one or more vars without touching others
az containerapp update `
  --name teampulse-api `
  --resource-group teampulse-rg `
  --set-env-vars "AllowedOrigins=https://teampulsewebks.z13.web.core.windows.net"
```

---

## Staging Container App

```bash
az containerapp create \
  --name teampulse-api-staging \
  --resource-group teampulse-rg \
  --environment teampulse-env \
  --image mcr.microsoft.com/dotnet/aspnet:10.0 \
  --target-port 8080 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 2 \
  --env-vars \
    "ConnectionStrings__DefaultConnection=Server=teampulse-sqlsrv.database.windows.net;Database=TeamPulseDbStaging;User Id=<sql-admin>;Password=<sql-password>;Encrypt=True;TrustServerCertificate=False" \
    "Jwt__Secret=<same-or-different-secret>" \
    "Jwt__Issuer=TeamPulseLocal" \
    "Jwt__Audience=TeamPulseLocal" \
    "AllowedOrigins=https://teampulsewebstg.z13.web.core.windows.net" \
    "App__Url=https://teampulsewebstg.z13.web.core.windows.net" \
    "Owner__Username=<owner-username>" \
    "Owner__Password=<owner-password>" \
    "PlatformAdmin__Username=<platform-admin-username>" \
    "PlatformAdmin__Password=<platform-admin-password>"
```

Staging API URL: `https://teampulse-api-staging.yellowisland-4fe46c53.eastus.azurecontainerapps.io`

> The URL hash (`yellowisland-4fe46c53`) is tied to the Container Apps **environment** (`teampulse-env`), not the individual app. Both staging and production share the same hash since they're in the same environment.

### Step 2 — Attach ACR credentials (staging)

```powershell
az containerapp registry set `
  --name teampulse-api-staging `
  --resource-group teampulse-rg `
  --server teampulseacrks.azurecr.io `
  --username teampulseacrks `
  --password <acr-password>
```

### Step 3 — Verify environment variables (staging)

```powershell
az containerapp show `
  --name teampulse-api-staging `
  --resource-group teampulse-rg `
  --query "properties.template.containers[0].env" `
  -o table
```

### Step 4 — Configure Health Probe (staging + production)

The health probe must be set via the **Azure Portal** — CLI flags for probes are not stable across CLI versions.

**Path:** Portal → Container Apps → `teampulse-api-staging` → **Application** (left sidebar, not Settings) → **Containers** → **Edit and deploy** → click the container name → **Health probes** tab

Settings:
| Field | Value |
|-------|-------|
| Type | Liveness |
| Transport | HTTP |
| Path | `/api/health` |
| Port | `8080` |
| Initial delay | `15` seconds |
| Period | `30` seconds |

Click **Save** → **Create** to apply. A new revision will be created.

Repeat for `teampulse-api` (production).

### Step 5 — Verify health after probe setup

```powershell
az containerapp revision list `
  --name teampulse-api-staging `
  --resource-group teampulse-rg `
  --query "[0].{status:properties.healthState, active:properties.active, replicas:properties.replicas}" `
  -o table
# Should show: Healthy  True  1
```

---

## Production Storage Account (Angular)

```bash
az storage account create \
  --name teampulsewebks \
  --resource-group teampulse-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

az storage blob service-properties update \
  --account-name teampulsewebks \
  --static-website \
  --index-document index.html \
  --404-document index.html
```

Production Angular URL: `https://teampulsewebks.z13.web.core.windows.net`

---

## Staging Storage Account (Angular)

```bash
az storage account create \
  --name teampulsewebstg \
  --resource-group teampulse-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

az storage blob service-properties update \
  --account-name teampulsewebstg \
  --static-website \
  --index-document index.html \
  --404-document index.html
```

Staging Angular URL: `https://teampulsewebstg.z13.web.core.windows.net`

---

## File Upload Storage (Azure File Share)

Container App containers are ephemeral — uploaded files would be lost on redeploy without persistent storage. Azure File Share is mounted as a volume so uploads survive restarts and redeployments.

### Step 1 — Create the storage account

```bash
az storage account create \
  --name teampulsestoreks \
  --resource-group teampulse-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2
```

### Step 2 — Get the storage key

```bash
az storage account keys list \
  --account-name teampulsestoreks \
  --resource-group teampulse-rg \
  --query "[0].value" -o tsv
```

### Step 3 — Create file shares

```bash
# Staging share
az storage share-rm create \
  --storage-account teampulsestoreks \
  --name tp-staging-uploads \
  --resource-group teampulse-rg \
  --quota 100

# Production share
az storage share-rm create \
  --storage-account teampulsestoreks \
  --name tp-prod-uploads \
  --resource-group teampulse-rg \
  --quota 100
```

### Step 4 — Link shares to the Container Apps environment

```bash
STORAGE_KEY="<key-from-step-2>"

# Staging
az containerapp env storage set \
  --name teampulse-env \
  --resource-group teampulse-rg \
  --storage-name teampulse-uploads-staging \
  --azure-file-account-name teampulsestoreks \
  --azure-file-account-key "$STORAGE_KEY" \
  --azure-file-share-name tp-staging-uploads \
  --access-mode ReadWrite

# Production
az containerapp env storage set \
  --name teampulse-env \
  --resource-group teampulse-rg \
  --storage-name teampulse-uploads-prod \
  --azure-file-account-name teampulsestoreks \
  --azure-file-account-key "$STORAGE_KEY" \
  --azure-file-share-name tp-prod-uploads \
  --access-mode ReadWrite
```

### Step 5 — Apply volume mount via YAML

Export the current YAML, add the volume and mount, then apply:

```bash
# Export
az containerapp show --name teampulse-api-staging --resource-group teampulse-rg -o yaml > staging-app.yaml
```

Edit `staging-app.yaml` — make three changes:

1. Under the container's `env:` list, add:
```yaml
      - name: Storage__UploadsPath
        value: /mnt/uploads
```

2. Under `resources:`, add `volumeMounts:`:
```yaml
      volumeMounts:
      - mountPath: /mnt/uploads
        volumeName: uploads-vol
```

3. Replace `volumes: []` (or `volumes: null`) with:
```yaml
    volumes:
    - name: uploads-vol
      storageType: AzureFile
      storageName: tp-staging-uploads
```

Apply:
```bash
az containerapp update --name teampulse-api-staging --resource-group teampulse-rg --yaml staging-app.yaml
```

Repeat for production (`teampulse-api` / `tp-prod-uploads`).

> The `Storage__UploadsPath` env var maps to `Storage:UploadsPath` in .NET config (double-underscore convention). Both `AttachmentController` and `MemberDocumentController` read this to resolve the upload directory.

---

## Service Principal for GitHub Actions

```bash
az ad sp create-for-rbac \
  --name "teampulse-github-actions" \
  --role Contributor \
  --scopes /subscriptions/<subscription-id>/resourceGroups/teampulse-rg \
  --sdk-auth
```

Save the output JSON as GitHub secret `AZURE_CREDENTIALS`.

---

## Complete Post-Setup Checklist

Use this checklist when setting up from scratch to verify nothing is missed.

### Infrastructure
- [ ] Resource group `teampulse-rg` created
- [ ] All resource providers registered (Microsoft.App, Microsoft.ContainerRegistry, Microsoft.Storage, Microsoft.Sql)
- [ ] ACR `teampulseacrks` created with admin enabled
- [ ] Container Apps environment `teampulse-env` created
- [ ] SQL Server `teampulse-sqlsrv` created
- [ ] SQL firewall rule `AllowAzureServices` added (0.0.0.0 → 0.0.0.0)
- [ ] SQL firewall rule added for your local IP (for SSMS access)
- [ ] Database `TeamPulseDb` created (production)
- [ ] Database `TeamPulseDbStaging` created (staging)

### Container Apps
- [ ] `teampulse-api` created with all env vars (incl. App__Url, PlatformAdmin__Username/Password, Storage__UploadsPath)
- [ ] `teampulse-api-staging` created with all env vars
- [ ] ACR credentials attached to `teampulse-api` via `az containerapp registry set`
- [ ] ACR credentials attached to `teampulse-api-staging` via `az containerapp registry set`
- [ ] Health probe configured on `teampulse-api` (HTTP `/api/health` port 8080)
- [ ] Health probe configured on `teampulse-api-staging` (HTTP `/api/health` port 8080)
- [ ] Both revisions show `Healthy` in `az containerapp revision list`
- [ ] Volume mount (`/mnt/uploads` → `uploads-vol`) configured on both Container Apps via YAML

### Storage Accounts (Angular)
- [ ] `teampulsewebks` created with static website enabled (index: `index.html`, 404: `index.html`)
- [ ] `teampulsewebstg` created with static website enabled (index: `index.html`, 404: `index.html`)

### File Upload Storage (Azure File Share)
- [ ] Storage account `teampulsestoreks` created
- [ ] File share `tp-staging-uploads` created (quota: 100 GiB)
- [ ] File share `tp-prod-uploads` created (quota: 100 GiB)
- [ ] `teampulse-uploads-staging` linked to `teampulse-env` pointing at `tp-staging-uploads`
- [ ] `teampulse-uploads-prod` linked to `teampulse-env` pointing at `tp-prod-uploads`
- [ ] Volume mount applied to `teampulse-api-staging` (YAML update)
- [ ] Volume mount applied to `teampulse-api` (YAML update)

### GitHub
- [ ] Service principal created and saved as `AZURE_CREDENTIALS` secret
- [ ] `staging` GitHub environment created with 3 secrets (AZURE_CREDENTIALS, ACR_USERNAME, ACR_PASSWORD)
- [ ] `production` GitHub environment created with same 3 secrets + required reviewer `rohitsharma9874`
- [ ] `production` environment deployment branch restricted to `main`

### Verify everything works
- [ ] Push to `develop` → staging pipelines complete → staging app loads at `https://teampulsewebstg.z13.web.core.windows.net/#/login`
- [ ] Login works on staging with `admin` / `password`
- [ ] Merge to `main` → approve production gate → production app loads at `https://teampulsewebks.z13.web.core.windows.net/#/login`

---

## Updating Container App Environment Variables

```powershell
az containerapp update `
  --name teampulse-api `
  --resource-group teampulse-rg `
  --set-env-vars "KEY=value" "KEY2=value2"
```

> `--set-env-vars` merges — it only updates specified vars and leaves others unchanged.

### View all current environment variables

```powershell
az containerapp show `
  --name teampulse-api `
  --resource-group teampulse-rg `
  --query "properties.template.containers[0].env" `
  -o table
```

---

## Useful Diagnostic Commands

```powershell
# Check what image is running
az containerapp show `
  --name teampulse-api `
  --resource-group teampulse-rg `
  --query "properties.template.containers[0].image" -o tsv

# Check revision health
az containerapp revision list `
  --name teampulse-api `
  --resource-group teampulse-rg `
  --query "[0].{status:properties.healthState, active:properties.active, replicas:properties.replicas}" `
  -o table

# View live logs
az containerapp logs show `
  --name teampulse-api `
  --resource-group teampulse-rg `
  --tail 50

# List ACR image tags
az acr repository show-tags `
  --name teampulseacrks `
  --repository teampulse-api `
  --orderby time_desc `
  --top 10 -o tsv

# Get storage key (for manual uploads)
az storage account keys list `
  --account-name teampulsewebks `
  --resource-group teampulse-rg `
  --query "[0].value" -o tsv
```
