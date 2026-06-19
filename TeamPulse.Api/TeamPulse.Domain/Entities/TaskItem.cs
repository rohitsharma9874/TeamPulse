using TeamPulse.Domain.Common;

namespace TeamPulse.Domain.Entities
{
    public class TaskItem : AuditableEntity
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string AssigneeId { get; set; } = string.Empty;
        // Stages: new | refinement | ready | in-progress | review | complete
        public string Status { get; set; } = "new";
        public string Priority { get; set; } = "Medium";      // Low | Medium | High | Urgent
        public string CompanyId { get; set; } = string.Empty;
        public string? CreatedByUserId { get; set; }

        public DateTime? DueDate { get; set; }
        public DateTime? CompletedAt { get; set; }

        public string? ClientContact { get; set; }
        public string? BillingDetails { get; set; }
        public string? PaymentStatus { get; set; } = "N/A";  // N/A | Pending | Partly Paid | Paid
        public string? Remarks { get; set; }

        public User? Assignee { get; set; }
    }
}
