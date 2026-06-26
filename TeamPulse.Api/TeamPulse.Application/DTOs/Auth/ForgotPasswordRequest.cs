using System.ComponentModel.DataAnnotations;

namespace TeamPulse.Application.DTOs.Auth
{
    public record ForgotPasswordRequest(
        [Required] string TenantId,
        [Required][EmailAddress] string Email);
}
