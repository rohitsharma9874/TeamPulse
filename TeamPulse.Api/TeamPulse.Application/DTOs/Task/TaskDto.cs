namespace TeamPulse.Application.DTOs.Task
{
    public record TaskDto(
        string Id,
        string Title,
        string Description,
        string Assignee,
        string Priority,
        string Status,
        DateTime? Deadline,
        string? ClientContact,
        string? Billing,
        string? PaymentStatus,
        string? Remarks,
        string? CreatedBy,
        DateTime? CompletedAt);
}
