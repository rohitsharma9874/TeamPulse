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
            var tenantId = context.User.FindFirstValue("companyId");
            if (!string.IsNullOrEmpty(tenantId))
                tenantContext.TenantId = tenantId;

            await _next(context);
        }
    }
}
