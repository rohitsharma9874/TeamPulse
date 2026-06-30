using TeamPulse.Application.Common.Interfaces;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Application.Interfaces
{
    public interface ICustomerRepository : IRepository<Customer>
    {
        Task<IReadOnlyList<Customer>> GetByCompanyAsync(string companyId);
    }
}
