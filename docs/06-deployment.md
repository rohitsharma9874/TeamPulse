# 06 — Deployment Guide

## Day-to-Day Workflow

### 1. Develop a feature

```bash
# Create a feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# ... make changes ...

git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

### 2. Open PR → develop

On GitHub, open a pull request from `feature/my-feature` → `develop`.

The CI pipeline automatically runs a **Build** check. Merge once it passes.

### 3. Auto-deploy to Staging

Merging to `develop` triggers the staging deployment automatically:

- **API**: Docker image built → pushed to ACR → `teampulse-api-staging` updated
- **Angular**: Built with `staging` config → uploaded to `teampulsewebstg` blob storage

Pipeline takes ~5–8 minutes. Check progress at:
`github.com/rohitsharma9874/TeamPulse → Actions`

### 4. Test on Staging

Open staging and verify your feature works:

- **Staging App**: https://teampulsewebstg.z13.web.core.windows.net/#/login
- **Staging API Health**: https://teampulse-api-staging.yellowisland-4fe46c53.eastus.azurecontainerapps.io/api/health

### 5. Promote to Production

```bash
# Create PR from develop to main on GitHub
# After code review, merge
```

After merging to `main`:

1. GitHub Actions starts the production pipeline
2. **Build** job runs automatically
3. **Deploy → Production** job **pauses** — waiting for approval
4. Go to: `Actions → [the run] → Review deployments → Approve`
5. Production deploys (~5–8 minutes)

### 6. Verify Production

- **Production App**: https://teampulsewebks.z13.web.core.windows.net/#/login
- **Production API Health**: https://teampulse-api.yellowisland-4fe46c53.eastus.azurecontainerapps.io/api/health

---

## Manual Deploy (Emergency / Hotfix)

If you need to deploy directly without going through the full pipeline:

```powershell
# Build and push image manually
az acr login --name teampulseacrks

docker build -t teampulseacrks.azurecr.io/teampulse-api:hotfix ./TeamPulse.API
docker push teampulseacrks.azurecr.io/teampulse-api:hotfix

# Deploy to production
az containerapp registry set `
  --name teampulse-api `
  --resource-group teampulse-rg `
  --server teampulseacrks.azurecr.io `
  --username teampulseacrks `
  --password <acr-password>

az containerapp update `
  --name teampulse-api `
  --resource-group teampulse-rg `
  --image teampulseacrks.azurecr.io/teampulse-api:hotfix
```

For Angular manual deploy:
```powershell
cd TeamPulse.Angular
npm ci --legacy-peer-deps
npx ng build --configuration production

$KEY = az storage account keys list `
  --account-name teampulsewebks `
  --resource-group teampulse-rg `
  --query "[0].value" -o tsv

az storage blob delete-batch `
  --account-name teampulsewebks `
  --source '$web' `
  --account-key $KEY

az storage blob upload-batch `
  --account-name teampulsewebks `
  --destination '$web' `
  --source dist/team-pulse.angular/browser `
  --account-key $KEY `
  --overwrite
```

---

## After Deployment — Browser Cache

Angular uses output hashing so filenames change on each build. After a production deployment:

- Users on the site should get the new version automatically on next page load
- If a user is seeing old behaviour, ask them to do: **Ctrl+Shift+R** (hard refresh)
- If that doesn't work: DevTools → Application → Session Storage → clear `tp_token` and `tp_user` → refresh

---

## Rollback

To roll back to a previous API version, update the Container App image to a previous SHA tag:

```powershell
# List available tags
az acr repository show-tags `
  --name teampulseacrks `
  --repository teampulse-api `
  --orderby time_desc `
  --top 10 -o tsv

# Roll back to a specific SHA
az containerapp update `
  --name teampulse-api `
  --resource-group teampulse-rg `
  --image teampulseacrks.azurecr.io/teampulse-api:<previous-sha>
```

For Angular rollback, redeploy the previous build from an older branch/tag.
