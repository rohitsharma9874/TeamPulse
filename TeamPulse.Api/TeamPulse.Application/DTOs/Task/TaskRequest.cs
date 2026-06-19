namespace TeamPulse.Application.DTOs.Task
{
    public record TaskRequest(
        string? Title,
        string? Description,
        string? Assignee,
        string? Priority,
        string? Status,
        DateTime? Deadline,
        string? ClientContact,
        string? Billing,
        string? PaymentStatus,
        string? Remarks);
}
