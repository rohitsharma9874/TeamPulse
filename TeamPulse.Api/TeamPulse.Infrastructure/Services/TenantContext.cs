namespace TeamPulse.Infrastructure.Services
{
    /// <summary>
    /// Scoped service populated by TenantMiddleware after JWT authentication.
    /// Null TenantId means no tenant filter (seeding, platform-admin).
    /// </summary>
    public class TenantContext
    {
        public string? TenantId { get; set; }
    }
}
