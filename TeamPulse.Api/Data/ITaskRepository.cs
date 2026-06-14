using TeamPulse.Api.Models;

namespace TeamPulse.Api.Data
{
    public interface ITaskRepository
    {
        IEnumerable<TaskItem> GetAll();
        TaskItem? GetById(string id);
        TaskItem Add(TaskItem task);
    }
}
