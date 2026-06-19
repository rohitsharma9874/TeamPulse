using TeamPulse.Domain.Common;

namespace TeamPulse.Domain.Entities
{
    /// <summary>
    /// Immutable activity/audit record — never soft-deleted, used for reporting and history.
    /// </summary>
    public class AuditLog : AuditableEntity
    {
        public string EntityType { get; set; } = string.Empty;  // e.g. "Task", "User"
        public string EntityId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;      // e.g. "Created Task"
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }                   // Used as target display name
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
        public string? ChangedBy { get; set; }                  // UserId of actor
        public string CompanyId { get; set; } = string.Empty;
    }
}
