using Microsoft.EntityFrameworkCore;
using TeamPulse.Api.Data.Context;
using TeamPulse.Api.Domain.Entities;
using TeamPulse.Api.Repositories.Interfaces;

namespace TeamPulse.Api.Repositories.Implementations
{
    public class AuditLogRepository : Repository<AuditLog>, IAuditLogRepository
    {
        public AuditLogRepository(TeamPulseDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<AuditLog>> GetEntityHistoryAsync(string entityType, string entityId)
        {
            return await _dbSet
                .Where(a => a.EntityType == entityType && a.EntityId == entityId)
                .OrderByDescending(a => a.ChangedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuditLog>> GetCompanyAuditLogAsync(string companyId, DateTime? fromDate = null, DateTime? toDate = null)
        {
            var query = _dbSet.Where(a => a.CompanyId == companyId);

            if (fromDate.HasValue)
                query = query.Where(a => a.ChangedAt >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(a => a.ChangedAt <= toDate.Value);

            return await query.OrderByDescending(a => a.ChangedAt).ToListAsync();
        }
    }
}
