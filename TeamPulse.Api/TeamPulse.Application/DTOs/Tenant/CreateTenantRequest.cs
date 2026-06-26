namespace TeamPulse.Application.DTOs.Tenant
{
    public record CreateTenantRequest(
        string Id,            // e.g. "ABC001"
        string Name,          // e.g. "ABC Consulting"
        string Tagline,
        string? LogoUrl,
        string AdminUsername,
        string AdminPassword,
        string AdminName,
        string AdminEmail);
}
