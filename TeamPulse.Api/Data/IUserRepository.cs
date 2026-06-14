using TeamPulse.Api.Models;

namespace TeamPulse.Api.Data
{
    public interface IUserRepository
    {
        IEnumerable<User> GetAll();
        User? GetById(string id);
        User? GetByUsername(string username);
        User Add(User user);
    }
}
