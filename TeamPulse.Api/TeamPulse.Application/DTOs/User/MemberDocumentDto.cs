namespace TeamPulse.Application.DTOs.User
{
    public record MemberDocumentDto(
        string   Id,
        string   UserId,
        string   DocumentType,
        string   OriginalName,
        string   ContentType,
        long     FileSize,
        string   UploadedBy,
        DateTime UploadedAt);
}
