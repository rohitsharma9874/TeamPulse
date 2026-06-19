using TeamPulse.Application.Interfaces;

namespace TeamPulse.Infrastructure.Services
{
    public class PasswordHasher : IPasswordHasher
    {
        public string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password, 12);
        public bool Verify(string password, string hash) => BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
