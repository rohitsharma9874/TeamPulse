# TeamPulse

## Local development setup

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
- API auth is currently a placeholder; it accepts a mocked bearer token.
- Later we will upgrade this flow to OAuth2 and persistent storage.
