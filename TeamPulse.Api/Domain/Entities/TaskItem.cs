using TeamPulse.Api.Domain.Base;

namespace TeamPulse.Api.Domain.Entities
{
    public class TaskItem : AuditableEntity
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string AssigneeId { get; set; } = string.Empty;
        public string Status { get; set; } = "pending"; // pending, in-progress, completed
        public string CompanyId { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        
        // Navigation properties
        public User? Assignee { get; set; }
    }
}
