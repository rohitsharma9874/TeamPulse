namespace TeamPulse.Domain.Common
{
    public abstract class AuditableEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? CreatedBy { get; set; }

        public DateTime? ModifiedAt { get; set; }
        public string? ModifiedBy { get; set; }

        public bool IsDeleted { get; set; } = false;
    }
}
