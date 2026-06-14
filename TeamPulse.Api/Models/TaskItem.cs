namespace TeamPulse.Api.Models
{
    public class TaskItem
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string AssigneeId { get; set; } = string.Empty;
        public string Status { get; set; } = "pending";
        public string CompanyId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DueDate { get; set; }
    }
}
