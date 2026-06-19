namespace TeamPulse.Application.DTOs.Task
{
    public record PaymentTransactionDto(
        string Id,
        string TaskId,
        decimal Amount,
        string PaymentMethod,
        string Notes,
        DateTime PaidOn,
        string RecordedBy);

    public record CreatePaymentTransactionRequest(
        decimal Amount,
        string PaymentMethod,
        string Notes,
        DateTime? PaidOn);
}
