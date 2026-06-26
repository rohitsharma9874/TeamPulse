namespace TeamPulse.Application.DTOs.Tenant
{
    public record UpdateTenantRequest(
        string Name,
        string Tagline,
        string? LogoUrl);
}
