using Microsoft.EntityFrameworkCore;
using TeamPulse.Api.Data.Context;
using TeamPulse.Api.Domain.Entities;
using TeamPulse.Api.Repositories.Interfaces;

namespace TeamPulse.Api.Repositories.Implementations
{
    public class TaskRepository : Repository<TaskItem>, ITaskRepository
    {
        public TaskRepository(TeamPulseDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<TaskItem>> GetTasksByAssigneeAsync(string assigneeId)
        {
            return await _dbSet
                .Where(t => t.AssigneeId == assigneeId && !t.IsDeleted)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TaskItem>> GetTasksByStatusAsync(string status)
        {
            return await _dbSet
                .Where(t => t.Status == status && !t.IsDeleted)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TaskItem>> GetCompanyTasksAsync(string companyId)
        {
            return await _dbSet
                .Where(t => t.CompanyId == companyId && !t.IsDeleted)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TaskItem>> GetOverdueTasksAsync(string companyId)
        {
            return await _dbSet
                .Where(t => t.CompanyId == companyId && t.DueDate < DateTime.UtcNow && t.Status != "completed" && !t.IsDeleted)
                .OrderBy(t => t.DueDate)
                .ToListAsync();
        }
    }
}
