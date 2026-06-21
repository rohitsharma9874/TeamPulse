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
| Storage (Production) | `teampulsewebks` | StorageV2 (LRS) | East US |
| Storage (Staging) | `teampulsewebstg` | StorageV2 (LRS) | East US |

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
    "Owner__Username=<owner-username>" \
    "Owner__Password=<owner-password>"
```

Production API URL: `https://teampulse-api.yellowisland-4fe46c53.eastus.azurecontainerapps.io`

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
    "Owner__Username=<owner-username>" \
    "Owner__Password=<owner-password>"
```

Staging API URL: `https://teampulse-api-staging.yellowisland-4fe46c53.eastus.azurecontainerapps.io`

> The URL hash (`yellowisland-4fe46c53`) is tied to the Container Apps **environment** (`teampulse-env`), not the individual app. Both staging and production share the same hash since they're in the same environment.

### Health Probe (configure after creation)

Set via Azure Portal: Container App → Application → Containers → Edit and deploy → Health probes:
- Type: Liveness
- Transport: HTTP
- Path: `/api/health`
- Port: `8080`
- Initial delay: `15` seconds
- Period: `30` seconds

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

## Updating Container App Environment Variables

```powershell
az containerapp update `
  --name teampulse-api `
  --resource-group teampulse-rg `
  --set-env-vars "KEY=value" "KEY2=value2"
```

> `--set-env-vars` merges — it only updates specified vars and leaves others unchanged.

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
