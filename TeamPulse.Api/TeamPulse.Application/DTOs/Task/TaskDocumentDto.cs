namespace TeamPulse.Application.DTOs.Task
{
    public record TaskDocumentDto(
        string Id,
        string TaskId,
        string OriginalName,
        string ContentType,
        long   FileSize,
        string UploadedBy,
        DateTime UploadedAt);
}
