# 10 — Quick Reference

## Application URLs

### Production
| Resource | URL |
|----------|-----|
| Angular App (Login) | https://teampulsewebks.z13.web.core.windows.net/#/login |
| Platform Admin Panel | https://teampulsewebks.z13.web.core.windows.net/#/platform-admin |
| API Base | https://teampulse-api.yellowisland-4fe46c53.eastus.azurecontainerapps.io |
| API Health | https://teampulse-api.yellowisland-4fe46c53.eastus.azurecontainerapps.io/api/health |
| API Docs (Scalar) | https://teampulse-api.yellowisland-4fe46c53.eastus.azurecontainerapps.io/scalar/v1 *(dev only — disabled in production)* |

### Staging
| Resource | URL |
|----------|-----|
| Angular App (Login) | https://teampulsewebstg.z13.web.core.windows.net/#/login |
| Platform Admin Panel | https://teampulsewebstg.z13.web.core.windows.net/#/platform-admin |
| API Base | https://teampulse-api-staging.yellowisland-4fe46c53.eastus.azurecontainerapps.io |
| API Health | https://teampulse-api-staging.yellowisland-4fe46c53.eastus.azurecontainerapps.io/api/health |

### Local Development
| Resource | URL |
|----------|-----|
| Angular App (Login) | http://localhost:4200/#/login |
| Platform Admin Panel | http://localhost:4200/#/platform-admin |
| API Base | http://localhost:5000 |
| Scalar API Docs | http://localhost:5000/scalar/v1 |

> Scalar (API documentation / Swagger replacement) is only available when the API runs in Development mode. It is disabled in Production and Staging.

---

## SQL Server Connection Strings

### Connect in SSMS (SQL Server Management Studio)

**Production Database**
```
Server:    teampulse-sqlsrv.database.windows.net
Database:  TeamPulseDb
Auth:      SQL Server Authentication
Username:  <sql-admin-username>
Password:  <sql-admin-password>
Encrypt:   Mandatory
```

**Staging Database**
```
Server:    teampulse-sqlsrv.database.windows.net
Database:  TeamPulseDbStaging
Auth:      SQL Server Authentication
Username:  <sql-admin-username>
Password:  <sql-admin-password>
Encrypt:   Mandatory
```

**Local Development**
```
Server:    (localdb)\mssqllocaldb
Database:  TeamPulseDb
Auth:      Windows Authentication
```

### Full Connection Strings (for appsettings / env vars)

```
# Production
Server=teampulse-sqlsrv.database.windows.net;Database=TeamPulseDb;User Id=<admin>;Password=<password>;Encrypt=True;TrustServerCertificate=False

# Staging
Server=teampulse-sqlsrv.database.windows.net;Database=TeamPulseDbStaging;User Id=<admin>;Password=<password>;Encrypt=True;TrustServerCertificate=False

# Local
Server=(localdb)\mssqllocaldb;Database=TeamPulseDb;Trusted_Connection=True;
```

> SSMS may ask you to "Add client IP to firewall" the first time you connect from a new machine. Click "Add my IP" and retry.

---

## Azure Portal Quick Links

| Resource | Portal Path |
|----------|------------|
| All Resources | portal.azure.com → Resource Groups → teampulse-rg |
| Production Container App | portal.azure.com → Container Apps → teampulse-api |
| Staging Container App | portal.azure.com → Container Apps → teampulse-api-staging |
| Container Registry | portal.azure.com → Container registries → teampulseacrks |
| SQL Server | portal.azure.com → SQL servers → teampulse-sqlsrv |
| Production DB | portal.azure.com → SQL databases → TeamPulseDb |
| Staging DB | portal.azure.com → SQL databases → TeamPulseDbStaging |
| Production Storage | portal.azure.com → Storage accounts → teampulsewebks |
| Staging Storage | portal.azure.com → Storage accounts → teampulsewebstg |

---

## Azure Troubleshooting Steps

### Container App is Unhealthy

1. **Check logs first:**
   ```powershell
   az containerapp logs show --name teampulse-api --resource-group teampulse-rg --tail 50
   ```

2. **Look for:** Exception messages, DB connection errors, or startup crashes.

3. **Check health probe:** Portal → Container App → Application → Containers → Edit and deploy → Health probes. Should be HTTP GET `/api/health` on port `8080`.

4. **Check env vars:** Portal → Container App → Settings → Environment variables. Verify connection string, JWT settings, AllowedOrigins are all present.

5. **Force a new revision** (restarts the container):
   ```powershell
   az containerapp update --name teampulse-api --resource-group teampulse-rg --set-env-vars "RESTART_TRIGGER=1"
   ```

---

### App Deployed But Not Updating

1. **Verify the correct image is running:**
   ```powershell
   az containerapp show --name teampulse-api --resource-group teampulse-rg --query "properties.template.containers[0].image" -o tsv
   ```

2. **Check GitHub Actions** — confirm the deploy job succeeded (green checkmark).

3. **Check ACR has the image:**
   ```powershell
   az acr repository show-tags --name teampulseacrks --repository teampulse-api --orderby time_desc --top 5 -o tsv
   ```

4. **Manually update to a specific image:**
   ```powershell
   az containerapp update --name teampulse-api --resource-group teampulse-rg --image teampulseacrks.azurecr.io/teampulse-api:<sha>
   ```

---

### Cannot Connect to SQL from SSMS

1. **Add your IP to SQL firewall:**
   ```powershell
   az sql server firewall-rule create `
     --resource-group teampulse-rg `
     --server teampulse-sqlsrv `
     --name MyOfficeIP `
     --start-ip-address <your-ip> `
     --end-ip-address <your-ip>
   ```
   Find your IP at: https://whatismyip.com

2. **In SSMS:** Ensure "Encrypt connection" is checked and "Trust server certificate" is unchecked.

3. **Verify database exists:**
   ```powershell
   az sql db list --resource-group teampulse-rg --server teampulse-sqlsrv --query "[].name" -o tsv
   ```

---

### Angular Not Loading New Code After Deployment

1. Hard refresh: **Ctrl+Shift+R**
2. Open incognito window
3. Clear browser cache: DevTools → Application → Storage → Clear site data
4. Check if the blob storage was actually updated:
   ```powershell
   az storage blob list `
     --account-name teampulsewebks `
     --container-name '$web' `
     --query "[?ends_with(name, 'index.html')].{name:name, modified:properties.lastModified}" `
     -o table
   ```
   The `lastModified` timestamp should match your deployment time.

---

### GitHub Actions Pipeline Failing

1. Go to: `github.com/rohitsharma9874/TeamPulse → Actions`
2. Click the failing run → expand the failing job → read the error
3. Common errors:
   - **UNAUTHORIZED** on ACR → re-add `ACR_PASSWORD` secret to the environment
   - **az: command not found** → add `azure/login@v2` step before az commands
   - **Build failed** → fix the code error shown in the dotnet/ng build output
   - **Environment not found** → create the `staging` or `production` environment in GitHub Settings

---

## GitHub Repository

| | |
|-|-|
| **URL** | https://github.com/rohitsharma9874/TeamPulse |
| **Main branch** | `main` (production) |
| **Integration branch** | `develop` (staging) |
| **Actions** | https://github.com/rohitsharma9874/TeamPulse/actions |
| **Environments** | https://github.com/rohitsharma9874/TeamPulse/settings/environments |
