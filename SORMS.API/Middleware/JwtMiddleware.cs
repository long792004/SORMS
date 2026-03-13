using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SORMS.API.Middleware
{
    public class JwtMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConfiguration _configuration;

        public JwtMiddleware(RequestDelegate next, IConfiguration configuration)
        {
            _next = next;
            _configuration = configuration;
        }

        public async Task Invoke(HttpContext context)
        {
            // Lấy token từ Header Authorization
            var token = context.Request.Headers["Authorization"]
                .FirstOrDefault()?.Split(" ").Last();

            if (!string.IsNullOrEmpty(token))
            {
                try
                {
                    // Validate token → nếu hợp lệ thì gán UserId vào context
                    if (ValidateToken(token, out var userId))
                    {
                        // Lưu thông tin user vào HttpContext để controller hoặc service khác có thể dùng
                        context.Items["UserId"] = userId;
                    }
                }
                catch
                {
                    // Nếu token lỗi hoặc hết hạn, middleware không chặn — để controller xử lý Unauthorized
                }
            }

            await _next(context);
        }

        private bool ValidateToken(string token, out int userId)
        {
            userId = 0;
            
            try
            {
                var key = _configuration["Jwt:Key"];
                if (string.IsNullOrEmpty(key) || key.Length < 32)
                    return false;

                var keyBytes = Encoding.UTF8.GetBytes(key);
                var securityKey = new SymmetricSecurityKey(keyBytes);

                var tokenHandler = new JwtSecurityTokenHandler();
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = securityKey,
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["Jwt:Issuer"] ?? "SORMS.API",
                    ValidateAudience = true,
                    ValidAudience = _configuration["Jwt:Audience"] ?? "SORMS.Client",
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
                
                var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(userIdClaim, out userId))
                {
                    return true;
                }
            }
            catch
            {
                // Token không hợp lệ
            }

            return false;
        }
    }
}
