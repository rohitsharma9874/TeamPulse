using System.ComponentModel.DataAnnotations;

namespace TeamPulse.Application.DTOs.Auth
{
    public record ResetPasswordRequest(
        [Required] string Token,
        [Required][MinLength(6)] string NewPassword);
}
