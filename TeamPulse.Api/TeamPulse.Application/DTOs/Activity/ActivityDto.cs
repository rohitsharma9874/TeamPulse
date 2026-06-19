namespace TeamPulse.Application.DTOs.Activity
{
    public record ActivityDto(
        string Id,
        string UserId,
        string Action,
        string Target,
        DateTime Timestamp);
}
