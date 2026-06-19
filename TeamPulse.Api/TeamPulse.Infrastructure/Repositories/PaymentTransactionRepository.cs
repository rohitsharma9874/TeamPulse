using Microsoft.EntityFrameworkCore;
using TeamPulse.Application.Interfaces;
using TeamPulse.Domain.Entities;
using TeamPulse.Infrastructure.Data;

namespace TeamPulse.Infrastructure.Repositories
{
    public class PaymentTransactionRepository : Repository<PaymentTransaction>, IPaymentTransactionRepository
    {
        public PaymentTransactionRepository(TeamPulseDbContext db) : base(db) { }

        public async Task<IReadOnlyList<PaymentTransaction>> GetByTaskAsync(string taskId) =>
            await _db.PaymentTransactions
                .Where(p => p.TaskId == taskId && !p.IsDeleted)
                .OrderByDescending(p => p.PaidOn)
                .ToListAsync();
    }
}
