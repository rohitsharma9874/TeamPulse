using TeamPulse.Api.Domain.Entities;

namespace TeamPulse.Api.Repositories.Interfaces
{
    public interface IUserRepository : IRepository<User>
    {
        Task<User?> GetByUsernameAsync(string username);
        Task<User?> GetByEmailAsync(string email);
        Task<IEnumerable<User>> GetCompanyUsersAsync(string companyId);
    }
}
