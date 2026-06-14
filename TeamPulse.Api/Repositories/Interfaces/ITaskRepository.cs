using TeamPulse.Api.Domain.Entities;

namespace TeamPulse.Api.Repositories.Interfaces
{
    public interface ITaskRepository : IRepository<TaskItem>
    {
        Task<IEnumerable<TaskItem>> GetTasksByAssigneeAsync(string assigneeId);
        Task<IEnumerable<TaskItem>> GetTasksByStatusAsync(string status);
        Task<IEnumerable<TaskItem>> GetCompanyTasksAsync(string companyId);
        Task<IEnumerable<TaskItem>> GetOverdueTasksAsync(string companyId);
    }
}
