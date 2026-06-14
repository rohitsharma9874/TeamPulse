using Microsoft.EntityFrameworkCore;
using TeamPulse.Api.Data.Context;
using TeamPulse.Api.Domain.Entities;
using TeamPulse.Api.Repositories.Interfaces;

namespace TeamPulse.Api.Repositories.Implementations
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(TeamPulseDbContext context) : base(context)
        {
        }

        public async Task<User?> GetByUsernameAsync(string username)
        {
            return await _dbSet.FirstOrDefaultAsync(u => u.Username == username && !u.IsDeleted);
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _dbSet.FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted);
        }

        public async Task<IEnumerable<User>> GetCompanyUsersAsync(string companyId)
        {
            return await _dbSet
                .Where(u => u.CompanyId == companyId && !u.IsDeleted)
                .ToListAsync();
        }
    }
}
