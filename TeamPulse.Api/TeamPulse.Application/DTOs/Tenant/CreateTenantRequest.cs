using System.ComponentModel.DataAnnotations;

namespace TeamPulse.Application.DTOs.Tenant
{
    public record CreateTenantRequest(
        string Id,            // e.g. "ABC001"
        string Name,          // e.g. "ABC Consulting"
        string Tagline,
        string? LogoUrl,
        string AdminUsername,
        string AdminName,
        [Required][EmailAddress] string AdminEmail,
        string? AdminPassword); // optional — if omitted a random password is set and a welcome email is sent
}
