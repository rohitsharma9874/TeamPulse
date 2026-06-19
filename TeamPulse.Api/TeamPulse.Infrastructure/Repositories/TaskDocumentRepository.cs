using Microsoft.EntityFrameworkCore;
using TeamPulse.Application.Interfaces;
using TeamPulse.Domain.Entities;
using TeamPulse.Infrastructure.Data;

namespace TeamPulse.Infrastructure.Repositories
{
    public class TaskDocumentRepository : Repository<TaskDocument>, ITaskDocumentRepository
    {
        public TaskDocumentRepository(TeamPulseDbContext db) : base(db) { }

        public async Task<IReadOnlyList<TaskDocument>> GetByTaskAsync(string taskId) =>
            await _db.TaskDocuments
                .Where(d => d.TaskId == taskId && !d.IsDeleted)
                .OrderByDescending(d => d.UploadedAt)
                .ToListAsync();
    }
}
