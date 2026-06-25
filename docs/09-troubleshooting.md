# 09 — Troubleshooting

## Login / Authentication Issues

### "Signing in..." stuck / no network request

**Cause:** CORS — the API's `AllowedOrigins` env var doesn't include the Angular app's URL.

**Fix:**
```powershell
az containerapp update `
  --name teampulse-api `
  --resource-group teampulse-rg `
  --set-env-vars "AllowedOrigins=https://teampulsewebks.z13.web.core.windows.net"
```

---

### 401 on all protected endpoints after login

**Cause:** JWT issuer/audience mismatch — token was generated with one issuer value but validated against a different one.

**Fix:** Ensure `Jwt__Issuer` and `Jwt__Audience` are set to the **same value** on the Container App as what `TokenService` generates. Both default to `TeamPulseLocal` if not set.

Also: **clear the browser's sessionStorage** — old tokens don't expire immediately. Go to DevTools → Application → Session Storage → clear `tp_token` and `tp_user`, then log in again.

---

### Permissions look wrong after deployment (sidebar missing tabs)

**Cause:** Browser has cached the old Angular JavaScript. The new code is deployed but not loaded.

**Fix:** Hard refresh with **Ctrl+Shift+R**, then clear sessionStorage and log in fresh. If still wrong, open an incognito window.

---

### "Provisional headers are shown" in Network tab

**Cause:** Request blocked before it left the browser — almost always CORS. Check the Console tab for the actual CORS error message.

---

## Container App Issues

### Revision shows "Unhealthy"

**Cause 1:** Container is crashing on startup — usually a database connection error.

**Diagnose:**
```powershell
az containerapp logs show --name teampulse-api --resource-group teampulse-rg --tail 50
```

Look for `Exception` or `Error` in the logs. Most common: `ConnectionStrings__DefaultConnection` is wrong or the SQL database doesn't exist.

**Cause 2:** Health probe hitting wrong path — app is running fine but probe gets a 404.

**Fix:** Configure health probe via Azure Portal → Container App → Application → Containers → Edit and deploy → Health probes:
- HTTP GET on `/api/health` port `8080`
- Initial delay: 15s, Period: 30s

---

### Container App not updating after pipeline runs

**Cause:** ACR credentials not set on the Container App — image pull fails silently.

**Fix:**
```powershell
az containerapp registry set `
  --name teampulse-api `
  --resource-group teampulse-rg `
  --server teampulseacrks.azurecr.io `
  --username teampulseacrks `
  --password <acr-password>
```

---

### "UNAUTHORIZED: authentication required" in pipeline

**Cause:** Container App doesn't have ACR pull credentials set.

**Fix:** Same as above — run `az containerapp registry set` before `az containerapp update`.

---

## Build / Pipeline Issues

### Angular build fails: `document.documentElement?.setAttribute is not a function`

**Cause:** Angular's `inlineCritical: true` (default) renders the app in JSDOM during build for critical CSS extraction. Chart.js accesses `document` at module init time, which fails in JSDOM.

**Fix:** Already applied — `angular.json` has `"inlineCritical": false` in the production/staging configurations.

---

### Angular build fails: CSS budget exceeded

**Cause:** Component SCSS file too large.

**Fix:** Already applied — `angular.json` budgets raised to `50kb` warn / `100kb` error per component style.

---

### API build fails: "Project file does not exist. Switch: TeamPulse.API/..."

**Cause:** Path in workflow uses wrong case. GitHub Actions runs on Linux (case-sensitive). The folder is `TeamPulse.Api` (lowercase `i`), not `TeamPulse.API`.

**Fix:** Always use `TeamPulse.Api/` in workflow paths.

---

### PR build check stuck on "Waiting for status to be reported"

**Cause:** GitHub uses the workflow file from the **base branch** for PR checks. If the workflow was only added to the feature/develop branch, main doesn't have it yet.

**Fix:** The repo owner needs to bypass branch protection and merge once to get the workflow onto `main`, or temporarily disable branch protection rules.

---

### Duplicate GitHub Actions checks on PRs

**Cause:** Both `push` (to develop) and `pull_request` events firing simultaneously when a PR is open.

**Fix:** Already applied — `push` trigger is `[develop, main]` only. PRs use the `pull_request` event exclusively.

---

## Azure Infrastructure Issues

### `MissingSubscriptionRegistration` error

**Cause:** Resource provider not registered on subscription.

**Fix:**
```bash
az provider register --namespace Microsoft.App --wait
az provider register --namespace Microsoft.ContainerRegistry --wait
az provider register --namespace Microsoft.Storage --wait
az provider register --namespace Microsoft.Sql --wait
```

---

### Container App quota error / App Service Plan quota error

**Cause:** Free/trial Azure subscriptions have zero quota for App Service VMs.

**Fix:** Use **Azure Container Apps** on the consumption plan instead of App Service — consumption plan has no vCPU quota restrictions.

---

### ACR Tasks blocked on subscription

**Cause:** Free/trial subscriptions may block ACR Tasks (cloud-based builds).

**Fix:** Already applied — pipeline uses `docker build` on the GitHub Actions runner (runs on GitHub's servers, not Azure) instead of ACR Tasks.

---

### Static Web Apps deployment token invalid

**Cause:** SWA created via CLI uses "None" provider mode — the deployment token generated doesn't work with the GitHub Actions SWA action or SWA CLI.

**Fix:** Already applied — use **Azure Blob Storage static website** instead of Static Web Apps.

---

### SPA routes return 404 on direct navigation or page refresh

**Cause:** Azure Blob Storage doesn't support server-side URL rewriting. Navigating directly to `/#/dashboard` works, but `/dashboard` doesn't have a corresponding file.

**Fix:** Already applied — Angular router uses `withHashLocation()` so all routes are hash-based (`/#/dashboard`). Blob Storage only needs to serve `index.html` for the root path.

---

## How to Get ACR Credentials

GitHub never shows saved secret values. Retrieve ACR credentials from:

```powershell
az acr credential show --name teampulseacrks --resource-group teampulse-rg
```

Or from **Azure Portal → Container registries → teampulseacrks → Settings → Access keys**.

Use `username` as `ACR_USERNAME` and either `password` or `password2` as `ACR_PASSWORD`.

---

## Useful One-Liners

```powershell
# Check what's running on production
az containerapp show --name teampulse-api --resource-group teampulse-rg --query "properties.template.containers[0].image" -o tsv

# Check revision health (staging)
az containerapp revision list --name teampulse-api-staging --resource-group teampulse-rg --query "[0].{status:properties.healthState,active:properties.active}" -o table

# Tail live logs
az containerapp logs show --name teampulse-api-staging --resource-group teampulse-rg --tail 50

# List all recent ACR image tags
az acr repository show-tags --name teampulseacrks --repository teampulse-api --orderby time_desc --top 10 -o tsv

# Force staging redeploy with empty commit
git commit --allow-empty -m "ci: trigger staging redeploy" && git push origin develop
```
