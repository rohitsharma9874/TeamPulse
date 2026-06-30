using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using TeamPulse.Domain.Entities;
using TeamPulse.Infrastructure;
using TeamPulse.Infrastructure.Data;
using TeamPulse.WebApi.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddControllers();
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
    o.MultipartBodyLengthLimit = 20_971_520); // 20 MB per upload
builder.WebHost.ConfigureKestrel(o =>
    o.Limits.MaxRequestBodySize = 20_971_520);

builder.Services.AddCors(options =>
    options.AddPolicy("CorsPolicy", p =>
    {
        if (builder.Environment.IsDevelopment())
            p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        else
        {
            var origins = (builder.Configuration["AllowedOrigins"] ?? "")
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
        }
    }));

var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? "TeamPulseLocalSecretKey123456789_ReplaceInProduction_MinimumLength32";
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"]   ?? "TeamPulseLocal",
            ValidAudience            = builder.Configuration["Jwt:Audience"] ?? "TeamPulseLocal",
            IssuerSigningKey         = key
        };
    });

builder.Services.AddAuthorization();

// Built-in .NET 10 OpenAPI (replaces Swashbuckle)
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, ct) =>
    {
        document.Info = new() { Title = "TeamPulse API", Version = "v1", Description = "TeamPulse workforce management API" };
        return Task.CompletedTask;
    });
});

var app = builder.Build();

// Apply EF migrations and seed on startup
using (var scope = app.Services.CreateScope())
{
    var db            = scope.ServiceProvider.GetRequiredService<TeamPulseDbContext>();
    var startupLogger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        await db.Database.MigrateAsync();
        await SeedAsync(db, app.Configuration);
    }
    catch (Exception ex)
    {
        startupLogger.LogCritical(ex, "Startup migration/seed failed — container will exit");
        throw;
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.MapOpenApi();                              // serves /openapi/v1.json
    app.MapScalarApiReference(options =>
    {
        options.Title           = "TeamPulse API";
        options.Theme           = ScalarTheme.Purple;
        options.DefaultHttpClient = new(ScalarTarget.Http, ScalarClient.Http11);
    });
}

app.UseCors("CorsPolicy");
app.UseAuthentication();
app.UseMiddleware<TenantMiddleware>();
app.UseAuthorization();
app.MapControllers();

app.Run();

static async Task SeedAsync(TeamPulseDbContext db, IConfiguration config)
{
    const string companyId = "KPA001";

    // Seed the PLATFORM tenant (parent company) — never visible to regular tenants
    if (!db.Tenants.Any(t => t.Id == "PLATFORM"))
    {
        db.Tenants.Add(new Tenant
        {
            Id        = "PLATFORM",
            Name      = "TeamPulse Platform",
            Tagline   = "Platform Administration",
            IsActive  = true,
            CreatedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();
    }

    // Seed platform-admin user — credentials from PlatformAdmin__Username / PlatformAdmin__Password
    // Upsert so that username/password changes in config take effect on restart.
    var platformAdminUsername = config["PlatformAdmin:Username"];
    var platformAdminPassword = config["PlatformAdmin:Password"];
    if (!string.IsNullOrEmpty(platformAdminUsername) && !string.IsNullOrEmpty(platformAdminPassword))
    {
        // Search globally by role — handles stale records seeded under wrong company
        var existingAdmin = await db.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Role == "platform-admin");

        if (existingAdmin is null)
        {
            db.Users.Add(new User
            {
                Username     = platformAdminUsername,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(platformAdminPassword, 12),
                Name         = "Platform Admin",
                Email        = $"{platformAdminUsername}@teampulse.platform",
                Role         = "platform-admin",
                CompanyId    = "PLATFORM",
                Department   = "Platform",
                CreatedAt    = DateTime.UtcNow,
                CreatedBy    = "system",
            });
        }
        else
        {
            existingAdmin.Username     = platformAdminUsername;
            existingAdmin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(platformAdminPassword, 12);
            existingAdmin.CompanyId    = "PLATFORM";  // Migrate if seeded under wrong company
            existingAdmin.Email        = $"{platformAdminUsername}@teampulse.platform";
            existingAdmin.IsDeleted    = false;
        }
        await db.SaveChangesAsync();
    }

    // Seed the KPA001 tenant if it doesn't exist yet
    if (!db.Tenants.Any(t => t.Id == companyId))
    {
        db.Tenants.Add(new Tenant
        {
            Id        = companyId,
            Name      = "KPA & Co.",
            Tagline   = "Workforce Intelligence",
            IsActive  = true,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }

    // Hidden owner account — credentials supplied via Owner__Username / Owner__Password env vars
    var ownerUsername = config["Owner:Username"];
    var ownerPassword = config["Owner:Password"];
    if (!string.IsNullOrEmpty(ownerUsername) && !string.IsNullOrEmpty(ownerPassword))
    {
        if (!db.Users.Any(u => u.Username == ownerUsername))
        {
            db.Users.Add(new User
            {
                Username     = ownerUsername,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(ownerPassword, 12),
                Name         = "Owner",
                Email        = $"{ownerUsername}@teampulse.local",
                Role         = "owner",
                Department   = "Management",
                CompanyId    = companyId,
                CreatedAt    = DateTime.UtcNow,
                CreatedBy    = "system"
            });
            await db.SaveChangesAsync();
        }
    }

    // Upsert demo users — self-healing on every deployment so staging/dev always have known credentials
    var demoPassword = BCrypt.Net.BCrypt.HashPassword("password", 12);

    var demoAdmin = await db.Users.IgnoreQueryFilters()
        .FirstOrDefaultAsync(u => u.CompanyId == companyId && u.Username == "admin");
    if (demoAdmin is null)
    {
        db.Users.Add(new User
        {
            Username     = "admin",
            PasswordHash = demoPassword,
            Name         = "Koshal Sharma",
            Email        = "admin@teampulse.local",
            Role         = "admin",
            Department   = "Management",
            Phone        = "9876543210",
            PhotoUrl     = "https://ui-avatars.com/api/?name=Koshal+Sharma&background=1B3A6B&color=fff",
            CompanyId    = companyId,
            CreatedAt    = DateTime.UtcNow,
            CreatedBy    = "system"
        });
    }
    else { demoAdmin.PasswordHash = demoPassword; demoAdmin.IsDeleted = false; }

    var demoManager = await db.Users.IgnoreQueryFilters()
        .FirstOrDefaultAsync(u => u.CompanyId == companyId && u.Username == "srmanager");
    if (demoManager is null)
    {
        db.Users.Add(new User
        {
            Username     = "srmanager",
            PasswordHash = demoPassword,
            Name         = "Priya Mehta",
            Email        = "priya.mehta@teampulse.local",
            Role         = "senior-manager",
            Department   = "Audit",
            Phone        = "9876543211",
            PhotoUrl     = "https://ui-avatars.com/api/?name=Priya+Mehta&background=C9A84C&color=fff",
            CompanyId    = companyId,
            CreatedAt    = DateTime.UtcNow,
            CreatedBy    = "system"
        });
    }
    else { demoManager.PasswordHash = demoPassword; demoManager.IsDeleted = false; }

    var demoTrainee = await db.Users.IgnoreQueryFilters()
        .FirstOrDefaultAsync(u => u.CompanyId == companyId && u.Username == "trainee");
    if (demoTrainee is null)
    {
        db.Users.Add(new User
        {
            Username     = "trainee",
            PasswordHash = demoPassword,
            Name         = "Ravi Kumar",
            Email        = "ravi.kumar@teampulse.local",
            Role         = "trainee",
            Department   = "Audit",
            Phone        = "9876543212",
            PhotoUrl     = "https://ui-avatars.com/api/?name=Ravi+Kumar&background=10b981&color=fff",
            CompanyId    = companyId,
            CreatedAt    = DateTime.UtcNow,
            CreatedBy    = "system"
        });
    }
    else { demoTrainee.PasswordHash = demoPassword; demoTrainee.IsDeleted = false; }

    await db.SaveChangesAsync();

    // Seed demo tasks only if none exist for this tenant
    var adminUser    = await db.Users.IgnoreQueryFilters().FirstAsync(u => u.CompanyId == companyId && u.Username == "admin");
    var managerUser  = await db.Users.IgnoreQueryFilters().FirstAsync(u => u.CompanyId == companyId && u.Username == "srmanager");
    var traineeUser  = await db.Users.IgnoreQueryFilters().FirstAsync(u => u.CompanyId == companyId && u.Username == "trainee");

    if (!db.Tasks.Any(t => t.CompanyId == companyId))
    {
        db.Tasks.AddRange(
            new TaskItem
            {
                Title           = "GST Return Filing",
                Description     = "File GST returns for Q1 prime clients.",
                AssigneeId      = managerUser.Id,
                Priority        = "Urgent",
                Status          = "new",
                DueDate         = DateTime.UtcNow.AddDays(3),
                ClientContact   = "Vikas Shah / 9812345678",
                BillingDetails  = "₹350",
                PaymentStatus   = "Pending",
                Remarks         = "Urgent compliance",
                CompanyId       = companyId,
                CreatedByUserId = adminUser.Id,
                CreatedAt       = DateTime.UtcNow,
                CreatedBy       = adminUser.Id
            },
            new TaskItem
            {
                Title           = "Onboarding Documentation",
                Description     = "Update trainee onboarding materials for new joiners.",
                AssigneeId      = traineeUser.Id,
                Priority        = "Medium",
                Status          = "in-progress",
                DueDate         = DateTime.UtcNow.AddDays(7),
                BillingDetails  = "Internal",
                PaymentStatus   = "N/A",
                CompanyId       = companyId,
                CreatedByUserId = adminUser.Id,
                CreatedAt       = DateTime.UtcNow,
                CreatedBy       = adminUser.Id
            }
        );
        await db.SaveChangesAsync();
    }
}
