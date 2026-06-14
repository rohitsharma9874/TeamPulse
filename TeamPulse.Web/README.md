# TeamPulse Web Prototype

## Local frontend usage

1. Start the backend API:
   - Open a terminal in `c:\KoshalAgarwal\TeamPulse\TeamPulse.Api`
   - Run: `dotnet run --urls http://localhost:5000`
2. Open `c:\KoshalAgarwal\TeamPulse\TeamPulse.Web\index.html` in your browser.
3. Use the example credentials:
   - `admin` / `password`
   - `manager` / `password`
   - `trainee` / `password`

## Notes
- The frontend stores the auth token in `sessionStorage`.
- This is a local prototype for development only.
- Later we will add enterprise authentication and persistent storage.
