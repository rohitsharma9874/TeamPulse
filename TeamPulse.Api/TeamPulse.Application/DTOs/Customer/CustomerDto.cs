namespace TeamPulse.Application.DTOs.Customer
{
    public record CustomerDto(
        string Id,
        string Name,
        string? Email,
        string? Phone,
        string? Address,
        string? Notes,
        bool IsActive,
        string CompanyId,
        DateTime CreatedAt);
}
