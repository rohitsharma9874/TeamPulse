using TeamPulse.Domain.Entities;

namespace TeamPulse.Application.Interfaces
{
    public interface ITokenService
    {
        string GenerateToken(User user);
    }
}
