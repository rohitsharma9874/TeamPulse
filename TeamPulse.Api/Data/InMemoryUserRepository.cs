using TeamPulse.Api.Models;

namespace TeamPulse.Api.Data
{
    public class InMemoryUserRepository : IUserRepository
    {
        private readonly List<User> _users = new()
        {
            new User { Id = "u1", Username = "admin", Password = "password", Name = "Administrator", Role = "admin", CompanyId = "c1" },
            new User { Id = "u2", Username = "manager", Password = "password", Name = "Manager User", Role = "manager", CompanyId = "c1" },
            new User { Id = "u3", Username = "trainee", Password = "password", Name = "Trainee User", Role = "trainee", CompanyId = "c1" }
        };

        public IEnumerable<User> GetAll() => _users;
        public User? GetById(string id) => _users.FirstOrDefault(u => u.Id == id);
        public User? GetByUsername(string username) => _users.FirstOrDefault(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));
        public User Add(User user)
        {
            user.Id = Guid.NewGuid().ToString("N");
            _users.Add(user);
            return user;
        }
    }
}
