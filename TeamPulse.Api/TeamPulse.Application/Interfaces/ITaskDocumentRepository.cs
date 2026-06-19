using TeamPulse.Application.Common.Interfaces;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Application.Interfaces
{
    public interface ITaskDocumentRepository : IRepository<TaskDocument>
    {
        Task<IReadOnlyList<TaskDocument>> GetByTaskAsync(string taskId);
    }
}
