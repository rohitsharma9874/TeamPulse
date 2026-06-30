using Microsoft.EntityFrameworkCore;
using TeamPulse.Application.Interfaces;
using TeamPulse.Domain.Entities;
using TeamPulse.Infrastructure.Data;

namespace TeamPulse.Infrastructure.Repositories
{
    public class CustomerRepository : Repository<Customer>, ICustomerRepository
    {
        public CustomerRepository(TeamPulseDbContext db) : base(db) { }

        public async Task<IReadOnlyList<Customer>> GetByCompanyAsync(string companyId) =>
            await _set.Where(c => c.CompanyId == companyId && !c.IsDeleted)
                      .OrderBy(c => c.Name)
                      .ToListAsync();
    }
}
