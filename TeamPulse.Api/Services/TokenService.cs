using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using TeamPulse.Api.Models;

namespace TeamPulse.Api.Services
{
    public class TokenService : ITokenService
    {
        private readonly string _secret;

        public TokenService(IConfiguration configuration)
        {
            _secret = configuration["Jwt:Secret"] ?? "DefaultLocalSecretKey12345_ReplaceWithLongKey";
        }

        public string CreateToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
                new Claim("name", user.Name),
                new Claim("role", user.Role),
                new Claim("companyId", user.CompanyId)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                issuer: "TeamPulseLocal",
                audience: "TeamPulseLocal",
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
