using TeamPulse.Api.Models;

namespace TeamPulse.Api.Services
{
    public interface ITokenService
    {
        string CreateToken(User user);
    }
}
