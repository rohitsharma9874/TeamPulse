using TeamPulse.Application.Common.Interfaces;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Application.Interfaces
{
    public interface IPaymentTransactionRepository : IRepository<PaymentTransaction>
    {
        Task<IReadOnlyList<PaymentTransaction>> GetByTaskAsync(string taskId);
    }
}
