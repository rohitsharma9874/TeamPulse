using TeamPulse.Api.Domain.Entities;

namespace TeamPulse.Api.Repositories.Interfaces
{
    public interface IAuditLogRepository : IRepository<AuditLog>
    {
        Task<IEnumerable<AuditLog>> GetEntityHistoryAsync(string entityType, string entityId);
        Task<IEnumerable<AuditLog>> GetCompanyAuditLogAsync(string companyId, DateTime? fromDate = null, DateTime? toDate = null);
    }
}
