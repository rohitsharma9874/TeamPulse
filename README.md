# TeamPulse

## Local development setup

### Project structure
- `TeamPulse.Api/` - ASP.NET Core backend API
- `TeamPulse.Web/` - simple static HTML/CSS/JS frontend prototype

### Backend API
1. Open a terminal in `c:\KoshalAgarwal\TeamPulse\TeamPulse.Api`
2. Run `dotnet run`
3. The API will start at `http://localhost:5000`

### Frontend
1. Open `c:\KoshalAgarwal\TeamPulse\TeamPulse.Web\index.html` in the browser
2. Use the following test login credentials:
   - `admin` / `password`
   - `manager` / `password`
   - `trainee` / `password`

### Notes
- The frontend currently uses local session storage for token storage.
- API auth is currently a placeholder for local prototype JWT auth.
- Later we will upgrade this flow to OAuth2 and persistent storage.

## Git workflow
1. Make small focused commits as features are developed.
2. Keep each commit message concise and descriptive.
3. Use `git status` to verify changed files before committing.
4. Ignore generated build folders; only commit source files and config.
