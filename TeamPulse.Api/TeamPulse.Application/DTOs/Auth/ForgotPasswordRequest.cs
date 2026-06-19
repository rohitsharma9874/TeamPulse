using System.ComponentModel.DataAnnotations;

namespace TeamPulse.Application.DTOs.Auth
{
    public record ForgotPasswordRequest([Required][EmailAddress] string Email);
}
