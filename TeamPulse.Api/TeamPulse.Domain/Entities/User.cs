using TeamPulse.Domain.Common;

namespace TeamPulse.Domain.Entities
{
    public class User : AuditableEntity
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = "trainee";
        public string CompanyId { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? PhotoUrl { get; set; }

        // Hierarchy
        public string? ReportsTo { get; set; }          // userId of direct manager

        // Demographic / contact
        public string? Designation { get; set; }        // job title (distinct from system Role)
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public DateTime? JoinDate { get; set; }
        public string? AddressLine1 { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PinCode { get; set; }
        public string? Country { get; set; }
        public string? EmergencyContact { get; set; }
        public string? EmergencyPhone { get; set; }

        // Password reset
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiry { get; set; }

        public ICollection<TaskItem> AssignedTasks { get; set; } = new List<TaskItem>();
        public ICollection<MemberDocument> Documents { get; set; } = new List<MemberDocument>();
    }
}
