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

        private string CurrentRole => User.FindFirstValue("role") ?? string.Empty;

        public TenantController(TeamPulseDbContext db, IPasswordHasher hasher)
        {
            _db     = db;
            _hasher = hasher;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            if (CurrentRole != "platform-admin") return Forbid();

            var tenants = await _db.Tenants
                .OrderBy(t => t.Name)
                .Select(t => new
                {
                    t.Id,
                    t.Name,
                    t.Tagline,
                    t.LogoUrl,
                    t.IsActive,
                    t.CreatedAt,
                    UserCount = _db.Users.Count(u => u.CompanyId == t.Id)
                })
                .ToListAsync();

            return Ok(tenants);
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
                PasswordHash = _hasher.Hash(req.AdminPassword),
                Name         = req.AdminName,
                Email        = req.AdminEmail,
                Role         = "admin",
                CompanyId    = tenant.Id,
                Department   = "Management",
                CreatedAt    = DateTime.UtcNow,
                CreatedBy    = "platform-admin",
            };
            _db.Users.Add(admin);

            await _db.SaveChangesAsync();

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
