using Microsoft.AspNetCore.Mvc;
using TeamPulse.Application.DTOs.Auth;
using TeamPulse.Application.Interfaces;

namespace TeamPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ITokenService _tokenService;
        private readonly IConfiguration _config;

        public AuthController(IAuthService authService, ITokenService tokenService, IConfiguration config)
        {
            _authService   = authService;
            _tokenService  = tokenService;
            _config        = config;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _authService.ValidateCredentialsAsync(request.Username, request.Password);
            if (user is null)
                return Unauthorized(new { message = "Invalid username or password" });

            var token = _tokenService.GenerateToken(user);
            var response = new LoginResponse(
                user.Id, user.Username, user.Name, user.Email,
                user.Role, user.CompanyId, user.Department, user.Phone,
                user.PhotoUrl ?? $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(user.Name)}&background=1B3A6B&color=fff",
                token);

            return Ok(response);
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            // Always return 200 to avoid exposing which emails are registered
            var appUrl = _config["App:Url"] ?? "http://localhost:4200";
            var resetBase = $"{appUrl}/reset-password";
            await _authService.InitiatePasswordResetAsync(request.Email, resetBase);
            return Ok(new { message = "If that email is registered, a reset link has been sent." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var success = await _authService.ResetPasswordAsync(request.Token, request.NewPassword);
            if (!success)
                return BadRequest(new { message = "This reset link is invalid or has expired." });

            return Ok(new { message = "Password reset successfully. You can now sign in." });
        }
    }
}
