using TeamPulse.Application.DTOs.Auth;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Application.Interfaces
{
    public interface IAuthService
    {
        Task<User?> ValidateCredentialsAsync(string username, string password, string tenantId);
        Task<User> RegisterAsync(RegisterUserRequest request, string companyId, string createdByUserId);
        Task<bool> InitiatePasswordResetAsync(string email, string tenantId, string resetLink);
        Task<bool> ResetPasswordAsync(string token, string newPassword);
    }
}
