using TeamPulse.Api.Domain.Entities;
using TeamPulse.Api.Repositories.Interfaces;

namespace TeamPulse.Api.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;

        public AuthService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<User?> ValidateCredentialsAsync(string username, string password)
        {
            var user = await _userRepository.GetByUsernameAsync(username);
            if (user == null || user.PasswordHash != password)
            {
                return null;
            }
            return user;
        }
    }
}
