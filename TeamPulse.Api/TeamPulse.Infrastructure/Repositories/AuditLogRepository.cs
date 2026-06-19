using Microsoft.EntityFrameworkCore;
using TeamPulse.Application.Interfaces;
using TeamPulse.Domain.Entities;
using TeamPulse.Infrastructure.Data;

namespace TeamPulse.Infrastructure.Repositories
{
    public class AuditLogRepository : Repository<AuditLog>, IAuditLogRepository
    {
        public AuditLogRepository(TeamPulseDbContext db) : base(db) { }

        public async Task<IReadOnlyList<AuditLog>> GetByCompanyAsync(string companyId, int limit = 200) =>
            await _db.AuditLogs
                .Where(a => a.CompanyId == companyId)
                .OrderByDescending(a => a.ChangedAt)
                .Take(limit)
                .ToListAsync();

        public async Task<IReadOnlyList<AuditLog>> GetByUserAsync(string userId, int limit = 100) =>
            await _db.AuditLogs
                .Where(a => a.ChangedBy == userId)
                .OrderByDescending(a => a.ChangedAt)
                .Take(limit)
                .ToListAsync();

        public async Task LogAsync(string companyId, string changedBy, string entityType, string entityId,
            string action, string? newValue = null, string? oldValue = null)
        {
            var log = new AuditLog
            {
                CompanyId = companyId,
                ChangedBy = changedBy,
                EntityType = entityType,
                EntityId = entityId,
                Action = action,
                NewValue = newValue,
                OldValue = oldValue,
                ChangedAt = DateTime.UtcNow,
                CreatedBy = changedBy,
                CreatedAt = DateTime.UtcNow
            };
            await _db.AuditLogs.AddAsync(log);
            await _db.SaveChangesAsync();
        }
    }
}
