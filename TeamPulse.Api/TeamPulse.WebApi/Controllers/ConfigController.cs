using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamPulse.Infrastructure.Data;

namespace TeamPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConfigController : ControllerBase
    {
        private readonly TeamPulseDbContext _db;

        public ConfigController(TeamPulseDbContext db) => _db = db;

        /// <summary>
        /// Returns tenant branding. Public — no auth required.
        /// Angular calls this on app init to load company name/tagline/logo.
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetConfig([FromQuery] string tenantId)
        {
            if (string.IsNullOrWhiteSpace(tenantId))
                return BadRequest(new { message = "tenantId is required" });

            var tenant = await _db.Tenants
                .FirstOrDefaultAsync(t => t.Id == tenantId && t.IsActive);

            if (tenant is null)
                return NotFound(new { message = "Tenant not found" });

            return Ok(new
            {
                tenantId = tenant.Id,
                name     = tenant.Name,
                tagline  = tenant.Tagline,
                logoUrl  = tenant.LogoUrl
            });
        }
    }
}
