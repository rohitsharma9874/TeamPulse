using System.Security.Cryptography;
using TeamPulse.Application.DTOs.Auth;
using TeamPulse.Application.Interfaces;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _users;
        private readonly IPasswordHasher _hasher;
        private readonly IEmailService _email;

        public AuthService(IUserRepository users, IPasswordHasher hasher, IEmailService email)
        {
            _users = users;
            _hasher = hasher;
            _email = email;
        }

        public async Task<User?> ValidateCredentialsAsync(string username, string password, string tenantId)
        {
            var user = await _users.GetByUsernameAndTenantAsync(username, tenantId);
            if (user is null || user.IsDeleted) return null;

            // Support plain-text dev seed passwords (no BCrypt prefix) and hashed passwords
            bool valid = user.PasswordHash.StartsWith("$2")
                ? _hasher.Verify(password, user.PasswordHash)
                : user.PasswordHash == password;

            return valid ? user : null;
        }

        public async Task<User> RegisterAsync(RegisterUserRequest request, string companyId, string createdByUserId)
        {
            if (await _users.UsernameExistsAsync(request.Username))
                throw new InvalidOperationException($"Username '{request.Username}' is already taken.");

            var user = new User
            {
                Username = request.Username,
                PasswordHash = _hasher.Hash(request.Password),
                Name = request.Name,
                Email = request.Email,
                Role = request.Role,
                CompanyId = companyId,
                Department = request.Department,
                Phone = request.Phone,
                PhotoUrl = request.PhotoUrl,
                CreatedBy = createdByUserId,
                CreatedAt = DateTime.UtcNow
            };

            await _users.AddAsync(user);
            await _users.SaveChangesAsync();
            return user;
        }

        public async Task<bool> InitiatePasswordResetAsync(string email, string resetLink)
        {
            var user = await _users.GetByEmailAsync(email);
            if (user is null || user.IsDeleted) return false;

            // Generate a secure URL-safe token
            var tokenBytes = RandomNumberGenerator.GetBytes(32);
            var token = Convert.ToBase64String(tokenBytes)
                .Replace('+', '-').Replace('/', '_').TrimEnd('=');

            user.PasswordResetToken  = token;
            user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
            await _users.UpdateAsync(user);
            await _users.SaveChangesAsync();

            var link = $"{resetLink}?token={Uri.EscapeDataString(token)}";
            await _email.SendPasswordResetEmailAsync(user.Email, user.Name, link);
            return true;
        }

        public async Task<bool> ResetPasswordAsync(string token, string newPassword)
        {
            var user = await _users.GetByResetTokenAsync(token);
            if (user is null) return false;

            user.PasswordHash            = _hasher.Hash(newPassword);
            user.PasswordResetToken      = null;
            user.PasswordResetTokenExpiry = null;
            await _users.UpdateAsync(user);
            await _users.SaveChangesAsync();
            return true;
        }
    }
}
