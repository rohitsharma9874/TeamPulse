using TeamPulse.Api.Models;

namespace TeamPulse.Api.Data
{
    public interface ITaskRepository
    {
        IEnumerable<TaskItem> GetAll();
        TaskItem? GetById(string id);
        TaskItem Add(TaskItem task);
        TaskItem? Update(string id, TaskItem task);
        bool Delete(string id);
    }
}
