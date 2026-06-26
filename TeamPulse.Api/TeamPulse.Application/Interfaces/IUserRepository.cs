using TeamPulse.Application.Common.Interfaces;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Application.Interfaces
{
    public interface IUserRepository : IRepository<User>
    {
        Task<User?> GetByUsernameAsync(string username);
        Task<User?> GetByUsernameAndTenantAsync(string username, string tenantId);
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByEmailAndTenantAsync(string email, string tenantId);
        Task<User?> GetByResetTokenAsync(string token);
        Task<IReadOnlyList<User>> GetByCompanyAsync(string companyId);
        Task<bool> UsernameExistsAsync(string username);
    }
}
