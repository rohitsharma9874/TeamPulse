using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamPulse.Application.DTOs.Task;
using TeamPulse.Application.Interfaces;
using TeamPulse.Domain.Entities;
using TeamPulse.Infrastructure.Data;

namespace TeamPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TaskController : ControllerBase
    {
        private readonly ITaskRepository _taskRepo;
        private readonly TeamPulseDbContext _db;

        // Roles that can see all tasks across the company
        private static readonly HashSet<string> AllTaskRoles = new(StringComparer.OrdinalIgnoreCase)
        {
            "owner", "admin", "sub-admin",
            "senior-manager", "managing-partner", "partner",
        };

        // Roles that can see all tasks in their own department
        private static readonly HashSet<string> ManagerRoles = new(StringComparer.OrdinalIgnoreCase)
        {
            "manager", "audit-manager", "tax-manager", "compliance-manager",
        };

        private static readonly HashSet<string> WriteTaskRoles = new(StringComparer.OrdinalIgnoreCase)
        {
            "owner", "admin", "sub-admin",
            "senior-manager", "managing-partner", "partner",
            "manager", "audit-manager", "tax-manager", "compliance-manager",
        };

        private static readonly HashSet<string> DeleteTaskRoles = new(StringComparer.OrdinalIgnoreCase)
        {
            "owner", "admin", "sub-admin",
            "senior-manager", "managing-partner", "partner"
        };

        public TaskController(ITaskRepository taskRepo, TeamPulseDbContext db)
        {
            _taskRepo = taskRepo;
            _db       = db;
        }

        private string CurrentUserId     => User.FindFirstValue(ClaimTypes.NameIdentifier)
                                         ?? User.FindFirstValue("sub") ?? string.Empty;
        private string CurrentUserRole   => User.FindFirstValue("role") ?? string.Empty;
        private string CurrentCompanyId  => User.FindFirstValue("companyId") ?? string.Empty;

        [HttpGet]
        public async Task<IActionResult> GetTasks()
        {
            var tasks = await _taskRepo.GetByCompanyAsync(CurrentCompanyId);

            if (ManagerRoles.Contains(CurrentUserRole))
            {
                // Managers see tasks assigned to anyone in their department
                var me = await _db.Users.AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == CurrentUserId);
                if (me?.Department is not null)
                {
                    var deptIds = (await _db.Users.AsNoTracking()
                        .Where(u => u.Department == me.Department)
                        .Select(u => u.Id)
                        .ToListAsync())
                        .ToHashSet(StringComparer.OrdinalIgnoreCase);

                    tasks = tasks.Where(t => deptIds.Contains(t.AssigneeId)).ToList();
                }
            }
            else if (!AllTaskRoles.Contains(CurrentUserRole))
            {
                // Associates/staff only see tasks assigned to or created by them
                tasks = tasks.Where(t =>
                    t.AssigneeId == CurrentUserId ||
                    t.CreatedByUserId == CurrentUserId).ToList();
            }

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

            // Notify the assignee if they are not the one creating the task
            if (!string.IsNullOrEmpty(task.AssigneeId) && task.AssigneeId != CurrentUserId)
            {
                _db.Notifications.Add(new Notification
                {
                    UserId    = task.AssigneeId,
                    CompanyId = task.CompanyId,
                    Type      = "task_assigned",
                    Message   = $"You've been assigned \"{task.Title}\"",
                    TaskId    = task.Id,
                });
                await _db.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetTask), new { id = task.Id }, ToDto(task));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(string id, [FromBody] TaskRequest request)
        {
            if (!WriteTaskRoles.Contains(CurrentUserRole))
                return Forbid();

            var task = await _taskRepo.GetByIdAsync(id);
            if (task is null) return NotFound();

            var previousAssigneeId = task.AssigneeId;

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

            // Notify the new assignee if they changed and the current user is not the new assignee
            if (!string.IsNullOrEmpty(task.AssigneeId)
                && task.AssigneeId != previousAssigneeId
                && task.AssigneeId != CurrentUserId)
            {
                _db.Notifications.Add(new Notification
                {
                    UserId    = task.AssigneeId,
                    CompanyId = task.CompanyId,
                    Type      = "task_assigned",
                    Message   = $"You've been assigned \"{task.Title}\"",
                    TaskId    = task.Id,
                });
                await _db.SaveChangesAsync();
            }

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
