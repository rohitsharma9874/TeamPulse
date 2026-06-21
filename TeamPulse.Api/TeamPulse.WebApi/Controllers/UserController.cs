using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamPulse.Application.DTOs.Auth;
using TeamPulse.Application.DTOs.User;
using TeamPulse.Application.Interfaces;

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

        public UserController(IUserRepository userRepo, IAuthService authService, IPasswordHasher hasher)
        {
            _userRepo = userRepo;
            _authService = authService;
            _hasher = hasher;
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
                request.Username, request.Password, request.Name,
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
                return CreatedAtAction(nameof(GetUsers), null, ToDto(user));
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            if (CurrentUserRole != "owner" && CurrentUserRole != "admin" && CurrentUserRole != "sub-admin")
                return Forbid();

            var user = await _userRepo.GetByIdAsync(id);
            if (user is null) return NotFound();

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

        private static UserDto ToDto(Domain.Entities.User u) => new(
            u.Id, u.Username, u.Name, u.Email, u.Role, u.Department, u.Phone,
            u.PhotoUrl ?? $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(u.Name)}&background=1B3A6B&color=fff",
            u.ReportsTo, u.Designation, u.Gender,
            u.DateOfBirth, u.JoinDate,
            u.AddressLine1, u.City, u.State, u.PinCode, u.Country,
            u.EmergencyContact, u.EmergencyPhone);
    }
}
