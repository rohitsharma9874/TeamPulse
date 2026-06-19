using TeamPulse.Domain.Common;

namespace TeamPulse.Domain.Entities
{
    public class PaymentTransaction : AuditableEntity
    {
        public string TaskId        { get; set; } = string.Empty;
        public string CompanyId     { get; set; } = string.Empty;
        public decimal Amount       { get; set; }
        public string PaymentMethod { get; set; } = "Bank Transfer"; // Cash | Bank Transfer | Cheque | Online | Other
        public string Notes         { get; set; } = string.Empty;
        public DateTime PaidOn      { get; set; } = DateTime.UtcNow;
        public string RecordedBy    { get; set; } = string.Empty;

        public TaskItem? Task { get; set; }
    }
}
