using TeamPulse.Domain.Common;

namespace TeamPulse.Domain.Entities
{
    public class MemberDocument : AuditableEntity
    {
        public string UserId       { get; set; } = string.Empty;
        public string DocumentType { get; set; } = "Other";        // Aadhar, PAN Card, Passport, Address Proof, Qualification, Other
        public string StoredName   { get; set; } = string.Empty;   // GUID-based filename on disk
        public string OriginalName { get; set; } = string.Empty;
        public string ContentType  { get; set; } = string.Empty;
        public long   FileSize     { get; set; }
        public string CompanyId    { get; set; } = string.Empty;
        public string UploadedBy   { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}
