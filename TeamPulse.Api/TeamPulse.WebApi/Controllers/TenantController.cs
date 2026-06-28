using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamPulse.Application.DTOs.Tenant;
using TeamPulse.Application.Interfaces;
using TeamPulse.Domain.Entities;
using TeamPulse.Infrastructure.Data;

namespace TeamPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TenantController : ControllerBase
    {
        private readonly TeamPulseDbContext _db;
        private readonly IPasswordHasher _hasher;
        private readonly IAuthService _authService;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _config;

        private string CurrentRole => User.FindFirstValue("role") ?? string.Empty;

        public TenantController(
            TeamPulseDbContext db,
            IPasswordHasher hasher,
            IAuthService authService,
            IEmailService emailService,
            IConfiguration config)
        {
            _db           = db;
            _hasher       = hasher;
            _authService  = authService;
            _emailService = emailService;
            _config       = config;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            if (CurrentRole != "platform-admin") return Forbid();

            var tenants = await _db.Tenants
                .OrderBy(t => t.Name)
                .ToListAsync();

            var userCounts = await _db.Users
                .IgnoreQueryFilters()
                .Where(u => !u.IsDeleted)
                .GroupBy(u => u.CompanyId)
                .Select(g => new { CompanyId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CompanyId, x => x.Count);

            return Ok(tenants.Select(t => new
            {
                t.Id,
                t.Name,
                t.Tagline,
                t.LogoUrl,
                t.IsActive,
                t.CreatedAt,
                UserCount = userCounts.GetValueOrDefault(t.Id, 0),
            }));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTenantRequest req)
        {
            if (CurrentRole != "platform-admin") return Forbid();

            if (await _db.Tenants.AnyAsync(t => t.Id == req.Id))
                return Conflict(new { message = $"Company code '{req.Id}' is already in use." });

            var tenant = new Tenant
            {
                Id        = req.Id.ToUpperInvariant(),
                Name      = req.Name,
                Tagline   = req.Tagline,
                LogoUrl   = req.LogoUrl,
                IsActive  = true,
                CreatedAt = DateTime.UtcNow,
            };
            _db.Tenants.Add(tenant);

            // Create the first admin user for this tenant
            var admin = new User
            {
                Username     = req.AdminUsername,
                PasswordHash = _hasher.Hash(GenerateRandomPassword()),
                Name         = req.AdminName,
                Email        = req.AdminEmail,
                Role         = "admin",
                CompanyId    = tenant.Id,
                Department   = "Management",
                CreatedAt    = DateTime.UtcNow,
                CreatedBy    = "platform-admin",
            };
            _db.Users.Add(admin);

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
                when (ex.InnerException?.Message.Contains("IX_Users_Email") == true ||
                      ex.InnerException?.Message.Contains("IX_Users_Username") == true)
            {
                return Conflict(new { message = "A user with that username or email already exists in this tenant." });
            }

            // Send welcome email — truly fire-and-forget so SMTP never blocks the API response
            if (!string.IsNullOrWhiteSpace(admin.Email) && !admin.Email.EndsWith("@teampulse.local"))
            {
                var capturedEmail    = admin.Email;
                var capturedName     = admin.Name;
                var capturedTenantId = tenant.Id;
                var capturedUsername = admin.Username;
                var capturedUserId   = admin.Id;
                var appUrl           = _config["App:Url"] ?? "http://localhost:4200";
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var link = await _authService.CreateSetPasswordLinkAsync(capturedUserId, appUrl);
                        await _emailService.SendWelcomeEmailAsync(capturedEmail, capturedName, capturedTenantId, capturedUsername, link);
                    }
                    catch { /* email failure must not affect the created tenant response */ }
                });
            }

            return CreatedAtAction(nameof(GetAll), new { id = tenant.Id }, new
            {
                tenant.Id,
                tenant.Name,
                tenant.Tagline,
                tenant.IsActive,
                tenant.CreatedAt,
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateTenantRequest req)
        {
            if (CurrentRole != "platform-admin") return Forbid();

            var tenant = await _db.Tenants.FindAsync(id);
            if (tenant is null) return NotFound();

            tenant.Name    = req.Name;
            tenant.Tagline = req.Tagline;
            tenant.LogoUrl = req.LogoUrl;

            await _db.SaveChangesAsync();
            return Ok(new { tenant.Id, tenant.Name, tenant.Tagline, tenant.LogoUrl, tenant.IsActive });
        }

        private static string GenerateRandomPassword()
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
            var bytes = new byte[16];
            System.Security.Cryptography.RandomNumberGenerator.Fill(bytes);
            var sb = new System.Text.StringBuilder();
            foreach (var b in bytes) sb.Append(chars[b % chars.Length]);
            return sb.ToString();
        }

        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> Toggle(string id)
        {
            if (CurrentRole != "platform-admin") return Forbid();

            var tenant = await _db.Tenants.FindAsync(id);
            if (tenant is null) return NotFound();
            if (id == "PLATFORM") return BadRequest(new { message = "Cannot deactivate the platform tenant." });

            tenant.IsActive = !tenant.IsActive;
            await _db.SaveChangesAsync();
            return Ok(new { tenant.Id, tenant.IsActive });
        }
    }
}
