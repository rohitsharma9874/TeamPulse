namespace TeamPulse.Application.DTOs.Activity
{
    public record LogActivityRequest(
        string EntityType,
        string EntityId,
        string Action,
        string? Target = null,
        string? OldValue = null);
}
