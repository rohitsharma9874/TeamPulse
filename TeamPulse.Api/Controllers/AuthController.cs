using Microsoft.AspNetCore.Mvc;
using TeamPulse.Api.Services;

namespace TeamPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ITokenService _tokenService;

        public AuthController(IAuthService authService, ITokenService tokenService)
        {
            _authService = authService;
            _tokenService = tokenService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _authService.ValidateCredentialsAsync(request.Username, request.Password);
            if (user == null)
            {
                return Unauthorized(new { message = "Invalid username or password" });
            }

            var token = _tokenService.CreateToken(user);
            var result = new LoginResponse(
                user.Id,
                user.Username,
                user.Name,
                user.Role,
                user.CompanyId,
                token
            );

            return Ok(result);
        }
    }

    public record LoginRequest(string Username, string Password);
    public record LoginResponse(string UserId, string Username, string Name, string Role, string CompanyId, string Token);
}
