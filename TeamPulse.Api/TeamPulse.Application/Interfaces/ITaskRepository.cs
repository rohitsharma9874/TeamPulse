using TeamPulse.Application.Common.Interfaces;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Application.Interfaces
{
    public interface ITaskRepository : IRepository<TaskItem>
    {
        Task<IReadOnlyList<TaskItem>> GetByCompanyAsync(string companyId);
        Task<IReadOnlyList<TaskItem>> GetByAssigneeAsync(string assigneeId);
        Task<TaskItem?> GetWithAssigneeAsync(string id);
    }
}
