using TeamPulse.Domain.Common;

namespace TeamPulse.Domain.Entities
{
    public class TaskItem : AuditableEntity
    {
        public int Number { get; set; }                       // per-tenant sequential, e.g. KPA-42
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string AssigneeId { get; set; } = string.Empty;
        // Stages: new | refinement | ready | in-progress | review | complete
        public string Status { get; set; } = "new";
        public string Priority { get; set; } = "Medium";     // Low | Medium | High | Urgent
        public string CompanyId { get; set; } = string.Empty;
        public string? CreatedByUserId { get; set; }

        public DateTime? DueDate { get; set; }
        public DateTime? CompletedAt { get; set; }

        // Customer relationship (replaces free-text ClientContact)
        public string? CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public string? ClientContact { get; set; }            // kept for backward compat / legacy data

        public string? BillingDetails { get; set; }
        public string? PaymentStatus { get; set; } = "N/A";  // N/A | Pending | Partly Paid | Paid
        public string? Remarks { get; set; }

        // Parent/child hierarchy — one level only (enforced in application layer)
        public string? ParentTaskId { get; set; }
        public TaskItem? ParentTask { get; set; }
        public ICollection<TaskItem> SubTasks { get; set; } = new List<TaskItem>();

        public User? Assignee { get; set; }
    }
}
