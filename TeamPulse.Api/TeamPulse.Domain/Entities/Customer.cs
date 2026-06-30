using TeamPulse.Domain.Common;

namespace TeamPulse.Domain.Entities
{
    public class Customer : AuditableEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? Notes { get; set; }
        public string CompanyId { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;

        public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    }
}
