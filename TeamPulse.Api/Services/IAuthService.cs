using TeamPulse.Api.Domain.Entities;

namespace TeamPulse.Api.Services
{
    public interface IAuthService
    {
        Task<User?> ValidateCredentialsAsync(string username, string password);
    }
}
