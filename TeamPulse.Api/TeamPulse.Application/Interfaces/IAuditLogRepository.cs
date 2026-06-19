using TeamPulse.Application.Common.Interfaces;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Application.Interfaces
{
    public interface IAuditLogRepository : IRepository<AuditLog>
    {
        Task<IReadOnlyList<AuditLog>> GetByCompanyAsync(string companyId, int limit = 200);
        Task<IReadOnlyList<AuditLog>> GetByUserAsync(string userId, int limit = 100);
        Task LogAsync(string companyId, string changedBy, string entityType, string entityId, string action, string? newValue = null, string? oldValue = null);
    }
}
