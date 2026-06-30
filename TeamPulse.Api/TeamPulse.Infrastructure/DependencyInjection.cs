using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TeamPulse.Application.Interfaces;
using TeamPulse.Application.Services;
using TeamPulse.Infrastructure.Data;
using TeamPulse.Infrastructure.Repositories;
using TeamPulse.Infrastructure.Services;
using TenantContext = TeamPulse.Infrastructure.Services.TenantContext;

namespace TeamPulse.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped<TenantContext>();
            services.AddHttpContextAccessor();

            services.AddDbContext<TeamPulseDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"),
                    sql => sql.MigrationsAssembly("TeamPulse.Infrastructure")));

            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<ITaskRepository, TaskRepository>();
            services.AddScoped<ICustomerRepository, CustomerRepository>();
            services.AddScoped<IAuditLogRepository, AuditLogRepository>();
            services.AddScoped<ITaskDocumentRepository, TaskDocumentRepository>();
            services.AddScoped<IMemberDocumentRepository, MemberDocumentRepository>();
            services.AddScoped<IPaymentTransactionRepository, PaymentTransactionRepository>();

            services.AddScoped<IPasswordHasher, PasswordHasher>();
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IEmailService, SmtpEmailService>();
            services.AddScoped<IAuthService, AuthService>();

            return services;
        }
    }
}
