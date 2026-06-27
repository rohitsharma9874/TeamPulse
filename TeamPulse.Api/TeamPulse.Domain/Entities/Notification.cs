namespace TeamPulse.Domain.Entities
{
    public class Notification
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        // task_assigned | deadline_approaching
        public string Type { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? TaskId { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
