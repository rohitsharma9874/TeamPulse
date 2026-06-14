using TeamPulse.Api.Domain.Base;

namespace TeamPulse.Api.Domain.Entities
{
    public class User : AuditableEntity
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = "user";
        public string CompanyId { get; set; } = string.Empty;
        
        // Navigation properties
        public ICollection<TaskItem> AssignedTasks { get; set; } = new List<TaskItem>();
    }
}
