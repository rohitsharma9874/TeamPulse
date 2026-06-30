using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TeamPulse.Application.DTOs.Auth;
using TeamPulse.Application.DTOs.User;
using TeamPulse.Application.Interfaces;
using TeamPulse.Domain.Entities;
using TeamPulse.Infrastructure.Data;

namespace TeamPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserRepository _userRepo;
        private readonly IAuthService _authService;
        private readonly IPasswordHasher _hasher;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _config;
        private readonly ILogger<UserController> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public UserController(
            IUserRepository userRepo,
            IAuthService authService,
            IPasswordHasher hasher,
            IEmailService emailService,
            IConfiguration config,
            ILogger<UserController> logger,
            IServiceScopeFactory scopeFactory)
        {
            _userRepo     = userRepo;
            _authService  = authService;
            _hasher       = hasher;
            _emailService = emailService;
            _config       = config;
            _logger       = logger;
            _scopeFactory = scopeFactory;
        }

        private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub") ?? string.Empty;
        private string CurrentUserCompanyId => User.FindFirstValue("companyId") ?? string.Empty;
        private string CurrentUserRole => User.FindFirstValue("role") ?? string.Empty;

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _userRepo.GetByCompanyAsync(CurrentUserCompanyId);
            return Ok(users.Select(ToDto));
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            if (CurrentUserRole != "owner" && CurrentUserRole != "admin" && CurrentUserRole != "sub-admin")
                return Forbid();

            var registerRequest = new RegisterUserRequest(
                request.Username, GenerateRandomPassword(), request.Name,
                request.Email ?? $"{request.Username}@teampulse.local",
                request.Role, request.Department ?? string.Empty,
                request.Phone ?? string.Empty, request.PhotoUrl);

            try
            {
                var user = await _authService.RegisterAsync(registerRequest, CurrentUserCompanyId, CurrentUserId);
                // Apply extended fields
                user.ReportsTo       = request.ReportsTo;
                user.Designation     = request.Designation;
                user.Gender          = request.Gender;
                user.DateOfBirth     = request.DateOfBirth;
                user.JoinDate        = request.JoinDate;
                user.AddressLine1    = request.AddressLine1;
                user.City            = request.City;
                user.State           = request.State;
                user.PinCode         = request.PinCode;
                user.Country         = request.Country;
                user.EmergencyContact = request.EmergencyContact;
                user.EmergencyPhone  = request.EmergencyPhone;
                await _userRepo.UpdateAsync(user);
                await _userRepo.SaveChangesAsync();

                // Fire-and-forget welcome email using its own DI scope so the
                // request scope disposal never kills the DbContext mid-flight.
                if (!string.IsNullOrWhiteSpace(user.Email) && !user.Email.EndsWith("@teampulse.local"))
                {
                    var capturedEmail    = user.Email;
                    var capturedName     = user.Name;
                    var capturedCompany  = CurrentUserCompanyId;
                    var capturedUsername = user.Username;
                    var capturedUserId   = user.Id;
                    var appUrl           = _config["App:Url"] ?? "http://localhost:4200";
                    var scopeFactory     = _scopeFactory;
                    var logger           = _logger;
                    _ = Task.Run(async () =>
                    {
                        using var scope       = scopeFactory.CreateScope();
                        var authService       = scope.ServiceProvider.GetRequiredService<IAuthService>();
                        var emailService      = scope.ServiceProvider.GetRequiredService<IEmailService>();
                        var db                = scope.ServiceProvider.GetRequiredService<TeamPulseDbContext>();
                        var log = new EmailLog
                        {
                            ToEmail   = capturedEmail,
                            ToName    = capturedName,
                            Type      = "welcome",
                            UserId    = capturedUserId,
                            CompanyId = capturedCompany,
                        };
                        try
                        {
                            var link = await authService.CreateSetPasswordLinkAsync(capturedUserId, appUrl);
                            await emailService.SendWelcomeEmailAsync(capturedEmail, capturedName, capturedCompany, capturedUsername, link);
                            log.Status = "sent";
                            logger.LogInformation("Welcome email sent to {Email} for user {UserId}", capturedEmail, capturedUserId);
                        }
                        catch (Exception ex)
                        {
                            log.Status       = "failed";
                            log.ErrorMessage = ex.Message;
                            logger.LogError(ex, "Welcome email failed for user {UserId} ({Email})", capturedUserId, capturedEmail);
                        }
                        try
                        {
                            db.EmailLogs.Add(log);
                            await db.SaveChangesAsync();
                        }
                        catch (Exception dbEx)
                        {
                            logger.LogError(dbEx, "Failed to write EmailLog for user {UserId}", capturedUserId);
                        }
                    });
                }

                return CreatedAtAction(nameof(GetUsers), null, ToDto(user));
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (DbUpdateException)
            {
                return Conflict(new { message = "A user with that username or email already exists." });
            }
        }

        [HttpGet("check-username/{username}")]
        public async Task<IActionResult> CheckUsername(string username)
        {
            if (string.IsNullOrWhiteSpace(username) || username.Length < 3)
                return Ok(new { available = false });

            var available = !await _userRepo.UsernameExistsAsync(username.Trim().ToLowerInvariant());
            return Ok(new { available });
        }

        [HttpGet("check-email/{email}")]
        public async Task<IActionResult> CheckEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
                return Ok(new { available = false });

            var available = !await _userRepo.EmailExistsAsync(email.Trim().ToLowerInvariant());
            return Ok(new { available });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            if (CurrentUserRole != "owner" && CurrentUserRole != "admin" && CurrentUserRole != "sub-admin")
                return Forbid();

            var user = await _userRepo.GetByIdAsync(id);
            if (user is null) return NotFound();

            // Mangle username and email so those values can be reused after deletion
            var ts = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            user.Username = $"{user.Username}__deleted__{ts}";
            if (!string.IsNullOrWhiteSpace(user.Email) && !user.Email.EndsWith("@teampulse.local"))
                user.Email = $"{user.Email}__deleted__{ts}";
            await _userRepo.UpdateAsync(user);

            await _userRepo.SoftDeleteAsync(id);
            await _userRepo.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProfile(string id, [FromBody] UpdateProfileRequest request)
        {
            if (id != CurrentUserId && CurrentUserRole != "owner" && CurrentUserRole != "admin" && CurrentUserRole != "sub-admin")
                return Forbid();

            var user = await _userRepo.GetByIdAsync(id);
            if (user is null) return NotFound();

            user.Name       = request.Name       ?? user.Name;
            user.Department = request.Department ?? user.Department;
            user.Phone      = request.Phone      ?? user.Phone;
            user.Email      = request.Email      ?? user.Email;
            if (!string.IsNullOrWhiteSpace(request.PhotoUrl))
                user.PhotoUrl = request.PhotoUrl;
            if (!string.IsNullOrWhiteSpace(request.NewPassword))
                user.PasswordHash = _hasher.Hash(request.NewPassword);

            // Extended fields (null means "don't change"; empty string clears)
            if (request.ReportsTo        != null) user.ReportsTo        = request.ReportsTo == "" ? null : request.ReportsTo;
            if (request.Designation      != null) user.Designation      = request.Designation;
            if (request.Gender           != null) user.Gender           = request.Gender;
            if (request.DateOfBirth      != null) user.DateOfBirth      = request.DateOfBirth;
            if (request.JoinDate         != null) user.JoinDate         = request.JoinDate;
            if (request.AddressLine1     != null) user.AddressLine1     = request.AddressLine1;
            if (request.City             != null) user.City             = request.City;
            if (request.State            != null) user.State            = request.State;
            if (request.PinCode          != null) user.PinCode          = request.PinCode;
            if (request.Country          != null) user.Country          = request.Country;
            if (request.EmergencyContact != null) user.EmergencyContact = request.EmergencyContact;
            if (request.EmergencyPhone   != null) user.EmergencyPhone   = request.EmergencyPhone;

            user.ModifiedBy = CurrentUserId;

            await _userRepo.UpdateAsync(user);
            await _userRepo.SaveChangesAsync();
            return Ok(ToDto(user));
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

        private static UserDto ToDto(Domain.Entities.User u) => new(
            u.Id, u.Username, u.Name, u.Email, u.Role, u.Department, u.Phone,
            u.PhotoUrl ?? $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(u.Name)}&background=1B3A6B&color=fff",
            u.ReportsTo, u.Designation, u.Gender,
            u.DateOfBirth, u.JoinDate,
            u.AddressLine1, u.City, u.State, u.PinCode, u.Country,
            u.EmergencyContact, u.EmergencyPhone);
    }
}
