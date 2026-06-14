namespace TeamPulse.Api.Domain.Base
{
    /// <summary>
    /// Base class for entities that require audit tracking.
    /// Tracks creation, modification, and soft delete information.
    /// </summary>
    public abstract class AuditableEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        
        // Audit fields
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? CreatedBy { get; set; }
        
        public DateTime? ModifiedAt { get; set; }
        public string? ModifiedBy { get; set; }
        
        /// <summary>
        /// Soft delete flag - allows data retention for auditing
        /// </summary>
        public bool IsDeleted { get; set; } = false;
    }
}
