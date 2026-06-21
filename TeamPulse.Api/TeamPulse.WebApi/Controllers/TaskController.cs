using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamPulse.Application.DTOs.Task;
using TeamPulse.Application.Interfaces;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TaskController : ControllerBase
    {
        private readonly ITaskRepository _taskRepo;

        private static readonly HashSet<string> AllTaskRoles = new(StringComparer.OrdinalIgnoreCase)
        {
            "owner", "admin", "sub-admin",
            "senior-manager", "managing-partner", "partner",
            "manager", "audit-manager", "tax-manager", "compliance-manager"
        };

        private static readonly HashSet<string> WriteTaskRoles = AllTaskRoles;

        private static readonly HashSet<string> DeleteTaskRoles = new(StringComparer.OrdinalIgnoreCase)
        {
            "owner", "admin", "sub-admin",
            "senior-manager", "managing-partner", "partner"
        };

        public TaskController(ITaskRepository taskRepo) => _taskRepo = taskRepo;

        private string CurrentUserId     => User.FindFirstValue(ClaimTypes.NameIdentifier)
                                         ?? User.FindFirstValue("sub") ?? string.Empty;
        private string CurrentUserRole   => User.FindFirstValue("role") ?? string.Empty;
        private string CurrentCompanyId  => User.FindFirstValue("companyId") ?? string.Empty;

        [HttpGet]
        public async Task<IActionResult> GetTasks()
        {
            var tasks = await _taskRepo.GetByCompanyAsync(CurrentCompanyId);

            // Associates/Staff (tier 4–5) only see tasks assigned to or created by them
            if (!AllTaskRoles.Contains(CurrentUserRole))
                tasks = tasks.Where(t =>
                    t.AssigneeId == CurrentUserId ||
                    t.CreatedByUserId == CurrentUserId).ToList();

            return Ok(tasks.Select(ToDto));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTask(string id)
        {
            var task = await _taskRepo.GetWithAssigneeAsync(id);
            return task is null ? NotFound() : Ok(ToDto(task));
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] TaskRequest request)
        {
            if (!WriteTaskRoles.Contains(CurrentUserRole))
                return Forbid();

            var task = FromRequest(request);
            task.CompanyId = CurrentCompanyId;
            task.CreatedByUserId = CurrentUserId;
            task.CreatedBy = CurrentUserId;

            await _taskRepo.AddAsync(task);
            await _taskRepo.SaveChangesAsync();
            return CreatedAtAction(nameof(GetTask), new { id = task.Id }, ToDto(task));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(string id, [FromBody] TaskRequest request)
        {
            if (!WriteTaskRoles.Contains(CurrentUserRole))
                return Forbid();

            var task = await _taskRepo.GetByIdAsync(id);
            if (task is null) return NotFound();

            task.Title         = request.Title         ?? task.Title;
            task.Description   = request.Description   ?? task.Description;
            task.AssigneeId    = request.Assignee       ?? task.AssigneeId;
            task.Status        = request.Status         ?? task.Status;
            task.Priority      = request.Priority       ?? task.Priority;
            task.DueDate       = request.Deadline       ?? task.DueDate;
            task.ClientContact = request.ClientContact  ?? task.ClientContact;
            task.BillingDetails = request.Billing       ?? task.BillingDetails;
            task.PaymentStatus  = request.PaymentStatus ?? task.PaymentStatus;
            task.Remarks        = request.Remarks       ?? task.Remarks;
            task.ModifiedBy     = CurrentUserId;

            if (task.Status == "complete" && task.CompletedAt is null)
                task.CompletedAt = DateTime.UtcNow;
            else if (task.Status != "complete")
                task.CompletedAt = null;

            await _taskRepo.UpdateAsync(task);
            await _taskRepo.SaveChangesAsync();
            return Ok(ToDto(task));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(string id)
        {
            if (!DeleteTaskRoles.Contains(CurrentUserRole))
                return Forbid();

            var task = await _taskRepo.GetByIdAsync(id);
            if (task is null) return NotFound();
            await _taskRepo.SoftDeleteAsync(id);
            await _taskRepo.SaveChangesAsync();
            return NoContent();
        }

        private static TaskDto ToDto(TaskItem t) => new(
            t.Id, t.Title, t.Description,
            t.AssigneeId, t.Priority, t.Status,
            t.DueDate, t.ClientContact, t.BillingDetails,
            t.PaymentStatus, t.Remarks, t.CreatedByUserId, t.CompletedAt);

        private static TaskItem FromRequest(TaskRequest r) => new()
        {
            Title           = r.Title       ?? string.Empty,
            Description     = r.Description ?? string.Empty,
            AssigneeId      = r.Assignee    ?? string.Empty,
            Status          = r.Status      ?? "new",
            Priority        = r.Priority    ?? "Medium",
            DueDate         = r.Deadline,
            ClientContact   = r.ClientContact,
            BillingDetails  = r.Billing,
            PaymentStatus   = r.PaymentStatus ?? "N/A",
            Remarks         = r.Remarks
        };
    }
}
