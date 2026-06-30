using Microsoft.EntityFrameworkCore;
using TeamPulse.Application.Interfaces;
using TeamPulse.Domain.Entities;
using TeamPulse.Infrastructure.Data;

namespace TeamPulse.Infrastructure.Repositories
{
    public class TaskRepository : Repository<TaskItem>, ITaskRepository
    {
        public TaskRepository(TeamPulseDbContext db) : base(db) { }

        public async Task<IReadOnlyList<TaskItem>> GetByCompanyAsync(string companyId) =>
            await _set.Include(t => t.Assignee)
                      .Include(t => t.Customer)
                      .Include(t => t.SubTasks)
                      .Where(t => t.CompanyId == companyId)
                      .ToListAsync();

        public async Task<IReadOnlyList<TaskItem>> GetByAssigneeAsync(string assigneeId) =>
            await _set.Include(t => t.Assignee)
                      .Include(t => t.Customer)
                      .Include(t => t.SubTasks)
                      .Where(t => t.AssigneeId == assigneeId)
                      .ToListAsync();

        public async Task<TaskItem?> GetWithAssigneeAsync(string id) =>
            await _set.Include(t => t.Assignee)
                      .Include(t => t.Customer)
                      .Include(t => t.SubTasks)
                      .FirstOrDefaultAsync(t => t.Id == id);
    }
}
