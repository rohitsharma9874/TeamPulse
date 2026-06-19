using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamPulse.Application.DTOs.Activity;
using TeamPulse.Application.Interfaces;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ActivityController : ControllerBase
    {
        private readonly IAuditLogRepository _logRepo;

        public ActivityController(IAuditLogRepository logRepo) => _logRepo = logRepo;

        private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub") ?? string.Empty;
        private string CurrentUserCompanyId => User.FindFirstValue("companyId") ?? string.Empty;

        [HttpGet]
        public async Task<IActionResult> GetActivities()
        {
            var logs = await _logRepo.GetByCompanyAsync(CurrentUserCompanyId, limit: 200);
            return Ok(logs.Select(ToDto));
        }

        [HttpPost]
        public async Task<IActionResult> LogActivity([FromBody] LogActivityRequest request)
        {
            await _logRepo.LogAsync(
                CurrentUserCompanyId, CurrentUserId,
                request.EntityType, request.EntityId,
                request.Action, request.Target, request.OldValue);

            return Ok(new { message = "Activity logged" });
        }

        private static ActivityDto ToDto(AuditLog a) => new(
            a.Id, a.ChangedBy ?? string.Empty,
            a.Action, a.NewValue ?? string.Empty, a.ChangedAt);
    }
}
