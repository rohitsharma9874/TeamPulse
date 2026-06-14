using TeamPulse.Api.Models;

namespace TeamPulse.Api.Data
{
    public class InMemoryTaskRepository : ITaskRepository
    {
        private readonly List<TaskItem> _tasks = new()
        {
            new TaskItem { Id = "t1", Title = "Prepare client report", Description = "Complete monthly status report", AssigneeId = "u2", Status = "pending", CompanyId = "c1", DueDate = DateTime.UtcNow.AddDays(5) },
            new TaskItem { Id = "t2", Title = "Review audit documents", Description = "Review audit submissions for current quarter", AssigneeId = "u3", Status = "in-progress", CompanyId = "c1", DueDate = DateTime.UtcNow.AddDays(3) }
        };

        public IEnumerable<TaskItem> GetAll() => _tasks;
        public TaskItem? GetById(string id) => _tasks.FirstOrDefault(t => t.Id == id);
        public TaskItem Add(TaskItem task)
        {
            task.Id = Guid.NewGuid().ToString("N");
            task.CreatedAt = DateTime.UtcNow;
            _tasks.Add(task);
            return task;
        }
    }
}
