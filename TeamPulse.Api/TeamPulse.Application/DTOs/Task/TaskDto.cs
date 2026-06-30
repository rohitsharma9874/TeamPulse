namespace TeamPulse.Application.DTOs.Task
{
    public record TaskDto(
        string Id,
        int Number,
        string Title,
        string Description,
        string Assignee,
        string Priority,
        string Status,
        DateTime? Deadline,
        string? ClientContact,
        string? CustomerId,
        string? CustomerName,
        string? Billing,
        string? PaymentStatus,
        string? Remarks,
        string? CreatedBy,
        DateTime? CompletedAt,
        string? ParentTaskId,
        int SubTaskCount);
}
