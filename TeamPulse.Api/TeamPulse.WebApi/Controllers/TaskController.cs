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
            "senior-manager", "senior_manager_audit", "senior_manager_compliance",
            "managing-partner", "partner",
        };

        // Roles that can see all tasks in their own department
        private static readonly HashSet<string> ManagerRoles = new(StringComparer.OrdinalIgnoreCase)
        {
            "manager", "audit-manager", "tax-manager", "compliance-manager",
            "manager_audit", "manager_audit_accounts", "manager_compliance_legal",
        };

        private static readonly HashSet<string> WriteTaskRoles = new(StringComparer.OrdinalIgnoreCase)
        {
            "owner", "admin", "sub-admin",
            "senior-manager", "senior_manager_audit", "senior_manager_compliance",
            "managing-partner", "partner",
            "manager", "audit-manager", "tax-manager", "compliance-manager",
            "manager_audit", "manager_audit_accounts", "manager_compliance_legal",
        };

        private static readonly HashSet<string> DeleteTaskRoles = new(StringComparer.OrdinalIgnoreCase)
        {
            "owner", "admin", "sub-admin",
            "senior-manager", "senior_manager_audit", "senior_manager_compliance",
            "managing-partner", "partner",
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

        [HttpGet("{id}/subtasks")]
        public async Task<IActionResult> GetSubTasks(string id)
        {
            var subtasks = await _db.Tasks
                .Include(t => t.Assignee)
                .Include(t => t.Customer)
                .Where(t => t.ParentTaskId == id)
                .ToListAsync();
            return Ok(subtasks.Select(ToDto));
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] TaskRequest request)
        {
            if (!WriteTaskRoles.Contains(CurrentUserRole))
                return Forbid();

            // Validate parent task if specified — enforce one-level hierarchy
            if (!string.IsNullOrEmpty(request.ParentTaskId))
            {
                var parent = await _taskRepo.GetByIdAsync(request.ParentTaskId);
                if (parent is null)
                    return BadRequest(new { message = "Parent task not found." });
                if (parent.ParentTaskId is not null)
                    return BadRequest(new { message = "Subtasks cannot have their own subtasks (max one level)." });
            }

            // Assign next sequential number for this tenant atomically
            var nextNumber = await _db.Tasks
                .IgnoreQueryFilters()
                .Where(t => t.CompanyId == CurrentCompanyId)
                .MaxAsync(t => (int?)t.Number) ?? 0;
            nextNumber++;

            var task = FromRequest(request);
            task.Number          = nextNumber;
            task.CompanyId       = CurrentCompanyId;
            task.CreatedByUserId = CurrentUserId;
            task.CreatedBy       = CurrentUserId;

            await _taskRepo.AddAsync(task);
            await _taskRepo.SaveChangesAsync();

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

            // Reload with navigation properties for the response
            var created = await _taskRepo.GetWithAssigneeAsync(task.Id);
            return CreatedAtAction(nameof(GetTask), new { id = task.Id }, ToDto(created!));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(string id, [FromBody] TaskRequest request)
        {
            if (!WriteTaskRoles.Contains(CurrentUserRole))
                return Forbid();

            var task = await _taskRepo.GetByIdAsync(id);
            if (task is null) return NotFound();

            var previousAssigneeId = task.AssigneeId;

            task.Title          = request.Title         ?? task.Title;
            task.Description    = request.Description   ?? task.Description;
            task.AssigneeId     = request.Assignee      ?? task.AssigneeId;
            task.Status         = request.Status        ?? task.Status;
            task.Priority       = request.Priority      ?? task.Priority;
            task.DueDate        = request.Deadline      ?? task.DueDate;
            task.ClientContact  = request.ClientContact ?? task.ClientContact;
            task.CustomerId     = request.CustomerId    == "" ? null : (request.CustomerId ?? task.CustomerId);
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

            var updated = await _taskRepo.GetWithAssigneeAsync(id);
            return Ok(ToDto(updated!));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(string id)
        {
            if (!DeleteTaskRoles.Contains(CurrentUserRole))
                return Forbid();

            var task = await _taskRepo.GetByIdAsync(id);
            if (task is null) return NotFound();

            // Prevent deleting a parent that still has subtasks
            var hasSubtasks = await _db.Tasks.AnyAsync(t => t.ParentTaskId == id);
            if (hasSubtasks)
                return BadRequest(new { message = "Delete all subtasks before deleting the parent task." });

            await _taskRepo.SoftDeleteAsync(id);
            await _taskRepo.SaveChangesAsync();
            return NoContent();
        }

        private static TaskDto ToDto(TaskItem t) => new(
            t.Id,
            t.Number,
            t.Title,
            t.Description,
            t.AssigneeId,
            t.Priority,
            t.Status,
            t.DueDate,
            t.ClientContact,
            t.CustomerId,
            t.Customer?.Name,
            t.BillingDetails,
            t.PaymentStatus,
            t.Remarks,
            t.CreatedByUserId,
            t.CompletedAt,
            t.ParentTaskId,
            t.SubTasks.Count(s => !s.IsDeleted));

        private static TaskItem FromRequest(TaskRequest r) => new()
        {
            Title           = r.Title        ?? string.Empty,
            Description     = r.Description  ?? string.Empty,
            AssigneeId      = r.Assignee     ?? string.Empty,
            Status          = r.Status       ?? "new",
            Priority        = r.Priority     ?? "Medium",
            DueDate         = r.Deadline,
            ClientContact   = r.ClientContact,
            CustomerId      = string.IsNullOrEmpty(r.CustomerId) ? null : r.CustomerId,
            BillingDetails  = r.Billing,
            PaymentStatus   = r.PaymentStatus ?? "N/A",
            Remarks         = r.Remarks,
            ParentTaskId    = string.IsNullOrEmpty(r.ParentTaskId) ? null : r.ParentTaskId,
        };
    }
}
