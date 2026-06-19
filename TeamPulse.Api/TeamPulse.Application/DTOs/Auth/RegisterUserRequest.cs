namespace TeamPulse.Application.DTOs.Auth
{
    public record RegisterUserRequest(
        string Username,
        string Password,
        string Name,
        string Email,
        string Role,
        string Department,
        string Phone,
        string? PhotoUrl);
}
