using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamPulse.Domain.Entities;
using TeamPulse.Infrastructure.Data;

namespace TeamPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly TeamPulseDbContext _db;

        public NotificationController(TeamPulseDbContext db) => _db = db;

        private string CurrentUserId     => User.FindFirstValue(ClaimTypes.NameIdentifier)
                                         ?? User.FindFirstValue("sub") ?? string.Empty;
        private string CurrentCompanyId  => User.FindFirstValue("companyId") ?? string.Empty;

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            await EnsureDeadlineNotificationsAsync();

            var notifications = await _db.Notifications
                .Where(n => n.UserId == CurrentUserId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(30)
                .ToListAsync();

            return Ok(notifications.Select(n => new
            {
                n.Id, n.Type, n.Message, n.TaskId, n.IsRead, n.CreatedAt,
            }));
        }

        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkRead(string id)
        {
            var n = await _db.Notifications.FindAsync(id);
            if (n is null || n.UserId != CurrentUserId) return NotFound();
            n.IsRead = true;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpPatch("read-all")]
        public async Task<IActionResult> MarkAllRead()
        {
            var unread = await _db.Notifications
                .Where(n => n.UserId == CurrentUserId && !n.IsRead)
                .ToListAsync();
            foreach (var n in unread) n.IsRead = true;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        private async Task EnsureDeadlineNotificationsAsync()
        {
            var now   = DateTime.UtcNow;
            var in24h = now.AddHours(24);
            var today = now.Date;

            var dueSoon = await _db.Tasks
                .Where(t => t.AssigneeId == CurrentUserId
                         && t.DueDate >= now
                         && t.DueDate <= in24h
                         && t.Status != "complete")
                .ToListAsync();

            var newNotifs = new List<Notification>();
            foreach (var task in dueSoon)
            {
                bool exists = await _db.Notifications.AnyAsync(n =>
                    n.UserId    == CurrentUserId &&
                    n.Type      == "deadline_approaching" &&
                    n.TaskId    == task.Id &&
                    n.CreatedAt >= today);

                if (!exists)
                {
                    var hoursLeft = (task.DueDate!.Value - now).TotalHours;
                    var msg = hoursLeft < 2
                        ? $"\"{task.Title}\" is due very soon!"
                        : $"\"{task.Title}\" is due in {(int)hoursLeft} hours";

                    newNotifs.Add(new Notification
                    {
                        UserId    = CurrentUserId,
                        CompanyId = CurrentCompanyId,
                        Type      = "deadline_approaching",
                        Message   = msg,
                        TaskId    = task.Id,
                    });
                }
            }

            if (newNotifs.Count > 0)
            {
                await _db.Notifications.AddRangeAsync(newNotifs);
                await _db.SaveChangesAsync();
            }
        }
    }
}
