using TeamPulse.Api.Models;

namespace TeamPulse.Api.Services
{
    public interface IAuthService
    {
        User? ValidateCredentials(string username, string password);
    }
}
