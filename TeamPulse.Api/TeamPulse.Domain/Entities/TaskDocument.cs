using TeamPulse.Domain.Common;

namespace TeamPulse.Domain.Entities
{
    public class TaskDocument : AuditableEntity
    {
        public string TaskId      { get; set; } = string.Empty;
        public string StoredName  { get; set; } = string.Empty;   // GUID-based filename on disk
        public string OriginalName{ get; set; } = string.Empty;   // user's original filename
        public string ContentType { get; set; } = string.Empty;
        public long   FileSize    { get; set; }
        public string CompanyId   { get; set; } = string.Empty;
        public string UploadedBy  { get; set; } = string.Empty;   // userId of uploader
        public DateTime UploadedAt{ get; set; } = DateTime.UtcNow;
    }
}
