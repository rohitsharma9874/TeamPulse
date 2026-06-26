namespace TeamPulse.Domain.Entities
{
    public class Tenant
    {
        public string Id { get; set; } = string.Empty;        // e.g. "KPA001"
        public string Name { get; set; } = string.Empty;      // e.g. "KPA & Co."
        public string Tagline { get; set; } = string.Empty;   // e.g. "Workforce Intelligence"
        public string? LogoUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
