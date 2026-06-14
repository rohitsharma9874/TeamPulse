using TeamPulse.Api.Data;
using TeamPulse.Api.Models;

namespace TeamPulse.Api.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;

        public AuthService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public User? ValidateCredentials(string username, string password)
        {
            var user = _userRepository.GetByUsername(username);
            if (user == null || user.Password != password)
            {
                return null;
            }
            return user;
        }
    }
}
