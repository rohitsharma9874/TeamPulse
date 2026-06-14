using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamPulse.Api.Data;
using TeamPulse.Api.Models;

namespace TeamPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TaskController : ControllerBase
    {
        private readonly ITaskRepository _taskRepository;

        public TaskController(ITaskRepository taskRepository)
        {
            _taskRepository = taskRepository;
        }

        [HttpGet]
        public IActionResult GetTasks()
        {
            var tasks = _taskRepository.GetAll();
            return Ok(tasks);
        }

        [HttpGet("{id}")]
        public IActionResult GetTask(string id)
        {
            var task = _taskRepository.GetById(id);
            if (task == null) return NotFound();
            return Ok(task);
        }

        [HttpPost]
        public IActionResult CreateTask([FromBody] TaskItem task)
        {
            var created = _taskRepository.Add(task);
            return CreatedAtAction(nameof(GetTask), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public IActionResult UpdateTask(string id, [FromBody] TaskItem task)
        {
            var existing = _taskRepository.GetById(id);
            if (existing == null) return NotFound();

            var updated = _taskRepository.Update(id, task);
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteTask(string id)
        {
            var existing = _taskRepository.GetById(id);
            if (existing == null) return NotFound();

            _taskRepository.Delete(id);
            return NoContent();
        }
    }
}
