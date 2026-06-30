using Microsoft.EntityFrameworkCore;
using TeamPulse.Application.Interfaces;
using TeamPulse.Domain.Entities;
using TeamPulse.Infrastructure.Data;

namespace TeamPulse.Infrastructure.Repositories
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(TeamPulseDbContext db) : base(db) { }

        public async Task<User?> GetByUsernameAsync(string username) =>
            await _set.FirstOrDefaultAsync(u => u.Username == username);

        // Used at login time — explicitly scopes by tenantId since TenantContext is not yet populated.
        public async Task<User?> GetByUsernameAndTenantAsync(string username, string tenantId) =>
            await _set.FirstOrDefaultAsync(u => u.Username == username && u.CompanyId == tenantId);

        public async Task<User?> GetByEmailAsync(string email) =>
            await _set.FirstOrDefaultAsync(u => u.Email == email);

        public async Task<User?> GetByEmailAndTenantAsync(string email, string tenantId) =>
            await _set.FirstOrDefaultAsync(u => u.Email == email && u.CompanyId == tenantId);

        public async Task<User?> GetByResetTokenAsync(string token) =>
            await _set.FirstOrDefaultAsync(u =>
                u.PasswordResetToken == token &&
                u.PasswordResetTokenExpiry != null &&
                u.PasswordResetTokenExpiry > DateTime.UtcNow);

        public async Task<IReadOnlyList<User>> GetByCompanyAsync(string companyId) =>
            await _set.Where(u => u.CompanyId == companyId).ToListAsync();

        public async Task<bool> UsernameExistsAsync(string username) =>
            await _set.AnyAsync(u => u.Username == username);

        public async Task<bool> EmailExistsAsync(string email) =>
            await _set.AnyAsync(u => u.Email == email);
    }
}
