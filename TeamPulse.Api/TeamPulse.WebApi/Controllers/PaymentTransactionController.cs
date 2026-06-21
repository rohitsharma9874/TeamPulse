using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamPulse.Application.DTOs.Task;
using TeamPulse.Application.Interfaces;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Api.Controllers
{
    [ApiController]
    [Route("api/payment-transaction")]
    [Authorize]
    public class PaymentTransactionController : ControllerBase
    {
        private readonly IPaymentTransactionRepository _repo;
        private readonly ITaskRepository _taskRepo;

        private static readonly HashSet<string> WriteRoles = new(StringComparer.OrdinalIgnoreCase)
        {
            "owner", "admin", "sub-admin",
            "senior-manager", "managing-partner", "partner",
            "manager", "audit-manager", "tax-manager", "compliance-manager"
        };

        public PaymentTransactionController(IPaymentTransactionRepository repo, ITaskRepository taskRepo)
        {
            _repo    = repo;
            _taskRepo = taskRepo;
        }

        private string CurrentUserId    => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? string.Empty;
        private string CurrentUserRole  => User.FindFirstValue("role") ?? string.Empty;
        private string CurrentCompanyId => User.FindFirstValue("companyId") ?? string.Empty;

        /// GET api/payment-transaction/task/{taskId}
        [HttpGet("task/{taskId}")]
        public async Task<IActionResult> GetByTask(string taskId)
        {
            var txns = await _repo.GetByTaskAsync(taskId);
            return Ok(txns.Select(ToDto));
        }

        /// POST api/payment-transaction/{taskId}
        [HttpPost("{taskId}")]
        public async Task<IActionResult> Create(string taskId, [FromBody] CreatePaymentTransactionRequest request)
        {
            if (!WriteRoles.Contains(CurrentUserRole))
                return Forbid();

            var task = await _taskRepo.GetByIdAsync(taskId);
            if (task is null) return NotFound("Task not found");

            var txn = new PaymentTransaction
            {
                TaskId        = taskId,
                CompanyId     = CurrentCompanyId,
                Amount        = request.Amount,
                PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod) ? "Bank Transfer" : request.PaymentMethod,
                Notes         = request.Notes ?? string.Empty,
                PaidOn        = request.PaidOn?.ToUniversalTime() ?? DateTime.UtcNow,
                RecordedBy    = CurrentUserId,
                CreatedBy     = CurrentUserId,
            };

            await _repo.AddAsync(txn);

            // Auto-update task paymentStatus based on all transactions
            var allTxns = (await _repo.GetByTaskAsync(taskId)).ToList();
            allTxns.Add(txn);
            var totalPaid = allTxns.Sum(t => t.Amount);

            task.PaymentStatus = totalPaid <= 0 ? "Pending"
                : TryParseBilling(task.BillingDetails) is decimal billing && billing > 0
                    ? (totalPaid >= billing ? "Paid" : "Partly Paid")
                    : "Partly Paid";
            task.ModifiedBy = CurrentUserId;

            await _taskRepo.UpdateAsync(task);
            await _repo.SaveChangesAsync();

            return CreatedAtAction(nameof(GetByTask), new { taskId }, ToDto(txn));
        }

        /// DELETE api/payment-transaction/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            if (!WriteRoles.Contains(CurrentUserRole))
                return Forbid();

            var txn = await _repo.GetByIdAsync(id);
            if (txn is null) return NotFound();

            await _repo.SoftDeleteAsync(id);
            await _repo.SaveChangesAsync();
            return NoContent();
        }

        private static PaymentTransactionDto ToDto(PaymentTransaction p) =>
            new(p.Id, p.TaskId, p.Amount, p.PaymentMethod, p.Notes, p.PaidOn, p.RecordedBy);

        private static decimal? TryParseBilling(string? billing)
        {
            if (string.IsNullOrWhiteSpace(billing)) return null;
            var cleaned = System.Text.RegularExpressions.Regex.Replace(billing, @"[^\d.]", "");
            return decimal.TryParse(cleaned, out var v) ? v : null;
        }
    }
}
