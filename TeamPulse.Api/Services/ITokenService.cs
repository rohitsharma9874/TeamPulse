using TeamPulse.Api.Domain.Entities;

namespace TeamPulse.Api.Services
{
    public interface ITokenService
    {
        string CreateToken(User user);
    }
}
