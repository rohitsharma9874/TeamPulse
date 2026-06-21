using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using TeamPulse.Domain.Entities;
using TeamPulse.Infrastructure;
using TeamPulse.Infrastructure.Data;

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
    var db = scope.ServiceProvider.GetRequiredService<TeamPulseDbContext>();
    db.Database.Migrate();
    await SeedAsync(db, app.Configuration);
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
app.UseAuthorization();
app.MapControllers();

app.Run();

static async Task SeedAsync(TeamPulseDbContext db, IConfiguration config)
{
    const string companyId = "KPA001";

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

    if (db.Users.Any(u => u.Role != "owner")) return;

    var admin = new User
    {
        Username     = "admin",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("password", 12),
        Name         = "Koshal Sharma",
        Email        = "admin@teampulse.local",
        Role         = "admin",
        Department   = "Management",
        Phone        = "9876543210",
        PhotoUrl     = "https://ui-avatars.com/api/?name=Koshal+Sharma&background=1B3A6B&color=fff",
        CompanyId    = companyId,
        CreatedAt    = DateTime.UtcNow,
        CreatedBy    = "system"
    };

    var manager = new User
    {
        Username     = "srmanager",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("password", 12),
        Name         = "Priya Mehta",
        Email        = "priya.mehta@teampulse.local",
        Role         = "senior-manager",
        Department   = "Audit",
        Phone        = "9876543211",
        PhotoUrl     = "https://ui-avatars.com/api/?name=Priya+Mehta&background=C9A84C&color=fff",
        CompanyId    = companyId,
        CreatedAt    = DateTime.UtcNow,
        CreatedBy    = "system"
    };

    var trainee = new User
    {
        Username     = "trainee",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("password", 12),
        Name         = "Ravi Kumar",
        Email        = "ravi.kumar@teampulse.local",
        Role         = "trainee",
        Department   = "Audit",
        Phone        = "9876543212",
        PhotoUrl     = "https://ui-avatars.com/api/?name=Ravi+Kumar&background=10b981&color=fff",
        CompanyId    = companyId,
        CreatedAt    = DateTime.UtcNow,
        CreatedBy    = "system"
    };

    db.Users.AddRange(admin, manager, trainee);

    db.Tasks.AddRange(
        new TaskItem
        {
            Title           = "GST Return Filing",
            Description     = "File GST returns for Q1 prime clients.",
            AssigneeId      = manager.Id,
            Priority        = "Urgent",
            Status          = "new",
            DueDate         = DateTime.UtcNow.AddDays(3),
            ClientContact   = "Vikas Shah / 9812345678",
            BillingDetails  = "₹350",
            PaymentStatus   = "Pending",
            Remarks         = "Urgent compliance",
            CompanyId       = companyId,
            CreatedByUserId = admin.Id,
            CreatedAt       = DateTime.UtcNow,
            CreatedBy       = admin.Id
        },
        new TaskItem
        {
            Title           = "Onboarding Documentation",
            Description     = "Update trainee onboarding materials for new joiners.",
            AssigneeId      = trainee.Id,
            Priority        = "Medium",
            Status          = "in-progress",
            DueDate         = DateTime.UtcNow.AddDays(7),
            BillingDetails  = "Internal",
            PaymentStatus   = "N/A",
            CompanyId       = companyId,
            CreatedByUserId = admin.Id,
            CreatedAt       = DateTime.UtcNow,
            CreatedBy       = admin.Id
        }
    );

    await db.SaveChangesAsync();
}
