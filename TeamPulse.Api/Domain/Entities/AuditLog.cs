using TeamPulse.Api.Domain.Base;

namespace TeamPulse.Api.Domain.Entities
{
    public class AuditLog : AuditableEntity
    {
        public string EntityType { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty; // Create, Update, Delete
        
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
        public string? ChangedBy { get; set; }
        public string CompanyId { get; set; } = string.Empty;
    }
}
