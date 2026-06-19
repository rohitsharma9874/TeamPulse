namespace TeamPulse.Application.DTOs.Auth
{
    public record LoginResponse(
        string Id,
        string Username,
        string Name,
        string Email,
        string Role,
        string CompanyId,
        string Department,
        string Phone,
        string? Photo,
        string Token);
}
