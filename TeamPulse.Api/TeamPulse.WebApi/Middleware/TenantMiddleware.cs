using System.Security.Claims;
using TeamPulse.Infrastructure.Services;

namespace TeamPulse.WebApi.Middleware
{
    public class TenantMiddleware
    {
        private readonly RequestDelegate _next;

        public TenantMiddleware(RequestDelegate next) => _next = next;

        public async Task InvokeAsync(HttpContext context, TenantContext tenantContext)
        {
            var role     = context.User.FindFirstValue("role");
            var tenantId = context.User.FindFirstValue("companyId");

            // platform-admin sees all tenants — leave TenantContext.TenantId null
            if (!string.IsNullOrEmpty(tenantId) && role != "platform-admin")
                tenantContext.TenantId = tenantId;

            await _next(context);
        }
    }
}
