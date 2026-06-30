namespace TeamPulse.Domain.Entities
{
    public class EmailLog
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ToEmail { get; set; } = string.Empty;
        public string ToName { get; set; } = string.Empty;
        // welcome | password-reset
        public string Type { get; set; } = string.Empty;
        public string? UserId { get; set; }
        public string? CompanyId { get; set; }
        // sent | failed | skipped
        public string Status { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }
        public DateTime TriggeredAt { get; set; } = DateTime.UtcNow;
    }
}
