using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Serilog.Core;
using SORMS.API.Configs; // namespace chứa JwtConfig
using SORMS.API.Data;
using SORMS.API.DTOs;
using SORMS.API.Interfaces;
using SORMS.API.Models;
using static Org.BouncyCastle.Math.EC.ECCurve;

namespace SORMS.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly SormsDbContext _context;
        private readonly JwtConfig _jwtConfig;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;
        private readonly AdminConfig _adminConfig;
       

        public AuthService(SormsDbContext context, IOptions<JwtConfig> jwtOptions, IEmailService emailService, IConfiguration configuration, ILogger<AuthService>logger, IOptions<AdminConfig> adminOptions)
        {
            _context = context;
            _jwtConfig = jwtOptions.Value;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
            _adminConfig = adminOptions.Value;

            // Debug log
            _logger.LogInformation($"📝 AdminConfig loaded: Username={_adminConfig.Username}, Email={_adminConfig.Email}");
        }

        public async Task<string> LoginAsync(LoginDto loginDto)
        {
            // ✅ KIỂM TRA ADMIN ACCOUNT TỪ CONFIG TRƯỚC
            if (loginDto.Email == _adminConfig.Email && loginDto.Password == _adminConfig.Password)
            {
                _logger.LogInformation($"🔐 Admin login from config: {_adminConfig.Email}");
                
                // Tạo User object giả để generate token
                var adminUser = new User
                {
                    Id = 0, // Admin ID đặc biệt
                    UserName = _adminConfig.Username,
                    Email = _adminConfig.Email,
                    RoleId = 1, // Admin role
                    IsActive = true,
                    Role = new Role { Id = 1, Name = "Admin", Description = "System Administrator" }
                };

                return GenerateJwtToken(adminUser);
            }

            // ✅ KIỂM TRA USER THƯỜNG TRONG DATABASE
            var user = await _context.Users
               .Include(u => u.Role)
               .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            if (user == null || !VerifyPassword(loginDto.Password, user.PasswordHash))
                return null;

            return GenerateJwtToken(user);
        }

        public async Task<string> RegisterAsync(RegisterDto registerDto)
        {
            var normalizedEmail = registerDto.Email?.Trim();
            var normalizedUserName = registerDto.UserName?.Trim();

            if (string.IsNullOrWhiteSpace(normalizedEmail) || string.IsNullOrWhiteSpace(normalizedUserName))
            {
                return null;
            }

            var existingUser = await _context.Users
                .AnyAsync(u => u.UserName == normalizedUserName || u.Email == normalizedEmail);

            if (existingUser)
                return null;

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Tạo User account
                var user = new User
                {
                    UserName = normalizedUserName,
                    PasswordHash = HashPassword(registerDto.Password),
                    RoleId = registerDto.RoleId,
                    IsActive = true,
                    Email = normalizedEmail
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync(); // Save để lấy user.Id

                // ✅ TỰ ĐỘNG TẠO RESIDENT PROFILE nếu role = 3 (Resident)
                if (user.RoleId == 3)
                {
                    var resident = new Resident
                    {
                        UserId = user.Id,
                        FullName = string.IsNullOrWhiteSpace(registerDto.FullName) ? user.UserName : registerDto.FullName.Trim(),
                        Email = user.Email,
                        Phone = registerDto.Phone?.Trim() ?? "",
                        IdentityNumber = registerDto.IdentityNumber?.Trim() ?? "",
                        Gender = string.IsNullOrWhiteSpace(registerDto.Gender) ? null : registerDto.Gender.Trim(),
                        DateOfBirth = NormalizeUtcDate(registerDto.DateOfBirth),
                        Role = null, // Sẽ được cập nhật sau (Lecturer/Staff/Guest)
                        RoomId = null, // Chưa có phòng
                        CheckInDate = DateTime.UtcNow,
                        CheckOutDate = null,
                        Address = string.IsNullOrWhiteSpace(registerDto.Address) ? null : registerDto.Address.Trim(),
                        EmergencyContact = string.IsNullOrWhiteSpace(registerDto.EmergencyContact) ? null : registerDto.EmergencyContact.Trim(),
                        Notes = "Auto-created during user registration",
                        IsActive = true
                    };

                    _context.Residents.Add(resident);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"Auto-created Resident profile for user: {user.UserName} (ID: {user.Id})");
                }

                await transaction.CommitAsync();

                // Tự động tạo token sau khi đăng ký thành công
                var token = GenerateJwtToken(user);
                return token;
            }
            catch (Exception ex)
            {
                try
                {
                    await transaction.RollbackAsync();
                }
                catch (Exception rollbackEx)
                {
                    _logger.LogWarning(rollbackEx, "Rollback failed while registering user with email {Email}", normalizedEmail);
                }

                _logger.LogError(ex, "Error while registering user with email {Email}", normalizedEmail);
                throw;
            }
        }

        private static DateTime? NormalizeUtcDate(DateTime? dateTime)
        {
            if (!dateTime.HasValue)
            {
                return null;
            }

            return dateTime.Value.Kind switch
            {
                DateTimeKind.Utc => dateTime,
                DateTimeKind.Local => dateTime.Value.ToUniversalTime(),
                _ => DateTime.SpecifyKind(dateTime.Value, DateTimeKind.Utc)
            };
        }

        public async Task<UserDto> GetUserByUsernameAsync(string username)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserName == username);

            if (user == null) return null;

            return new UserDto
            {
                Id = user.Id,
                Username = user.UserName,
                RoleName = user.Role.Name,
                Email = user.Email,
                IsActive = user.IsActive
            };
        }

        public async Task<UserDto> GetUserByEmailAsync(string email)
        {
            // ✅ KIỂM TRA ADMIN ACCOUNT TỪ CONFIG TRƯỚC
            if (email == _adminConfig.Email)
            {
                return new UserDto
                {
                    Id = 0, // Admin ID đặc biệt
                    Username = _adminConfig.Username,
                    RoleName = "Admin",
                    Email = _adminConfig.Email,
                    IsActive = true
                };
            }

            // ✅ KIỂM TRA USER THƯỜNG TRONG DATABASE
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null) return null;

            return new UserDto
            {
                Id = user.Id,
                Username = user.UserName,
                RoleName = user.Role.Name,
                Email = user.Email,
                IsActive = user.IsActive
            };
        }

        // =================== FORGOT PASSWORD ===================

        // 1. Gửi OTP qua Email
        public async Task<bool> SendOtpAsync(string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return false
            ;

            var otp = new Random().Next(100000, 999999).ToString(); // 6 digits
            user.ResetOtp = otp;
            user.ResetOtpExpiry = DateTime.UtcNow.AddMinutes(5);

            await _context.SaveChangesAsync();

            // gửi email
            await _emailService.SendEmailAsync(email, "Mã OTP khôi phục mật khẩu", $"Mã OTP của bạn là: {otp}");

            return true;
        }

        // 2. Xác minh OTP
        public async Task<bool> VerifyOtpAsync(string email, string otp)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return false;

            if (user.ResetOtp != otp || user.ResetOtpExpiry < DateTime.UtcNow)
                return false;

            return true;
        }

        // 3. Đặt lại mật khẩu bằng OTP
        public async Task<bool> ResetPasswordAsync(string email, string otp, string newPassword)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return false;

            if (user.ResetOtp != otp || user.ResetOtpExpiry < DateTime.UtcNow)
                return false;

            user.PasswordHash = HashPassword(newPassword);
            user.ResetOtp = null;
            user.ResetOtpExpiry = null;

            await _context.SaveChangesAsync();
            return true;
        }

        // =================== JWT & Helpers ===================

        public string GenerateJwtToken(User user)
        {
            try
            {
                // 1️⃣ Xác định vai trò dựa trên RoleId
                string roleName = user.RoleId switch
                {
                    1 => "Admin",
                    2 => "Staff",
                    3 => "Resident",
                    4 => "Guest",
                    _ => "Guest" // mặc định nếu có lỗi hoặc null
                };

                // 2️⃣ Lấy secret key từ appsettings.json
                var key = _configuration["Jwt:Key"];
                if (string.IsNullOrEmpty(key) || key.Length < 32)
                {
                    throw new InvalidOperationException(
                        "JWT Key must be configured in appsettings.json and be at least 32 characters long");
                }

                var keyBytes = Encoding.UTF8.GetBytes(key);
                var securityKey = new SymmetricSecurityKey(keyBytes);
                var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

                var claims = new List<Claim>
{
                    new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),   // "sub"
                    new Claim("username", user.UserName),
                    new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),     // name id
                    new Claim(ClaimTypes.Role, roleName),                         // schema role
                    new Claim("role", roleName)                                   // plain "role" for compatibility
};

                // Nếu là Resident, thêm ResidentId claim
                if (user.RoleId == 3)
                {
                    var resident = _context.Residents.FirstOrDefault(r => r.UserId == user.Id);
                    if (resident != null)
                    {
                        claims.Add(new Claim("ResidentId", resident.Id.ToString()));
                    }
                }

                // Nếu là Staff, thêm StaffId claim
                if (user.RoleId == 2)
                {
                    var staff = _context.Staffs.FirstOrDefault(s => s.Email == user.Email);
                    if (staff == null)
                    {
                        staff = _context.Staffs.FirstOrDefault(s => s.FullName == user.UserName);
                    }
                    if (staff != null)
                    {
                        claims.Add(new Claim("StaffId", staff.Id.ToString()));
                    }
                }

                // 4️⃣ Đọc config JWT
                var issuer = _configuration["Jwt:Issuer"] ?? "SORMS.API";
                var audience = _configuration["Jwt:Audience"] ?? "SORMS.Client";
                var expiryMinutes = int.Parse(_configuration["Jwt:ExpiryMinutes"] ?? "1440");

                // 5️⃣ Sinh JWT token
                var token = new JwtSecurityToken(
                    issuer: issuer,
                    audience: audience,
                    claims: claims,
                    expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                    signingCredentials: credentials
                );

                // 6️⃣ Chuyển token thành chuỗi
                var tokenHandler = new JwtSecurityTokenHandler();
                var tokenString = tokenHandler.WriteToken(token);

                _logger.LogInformation($"Token generated for user: {user.UserName} with role {roleName}");

                return tokenString;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error generating token: {ex.Message}");
                throw;
            }
        }


        //private string GenerateJwtToken(User user)
        //{
        //    var jwtSettings = _configuration.GetSection("JwtSettings");
        //    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]));
        //    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        //    var claims = new[]
        //    {
        //        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString(), ClaimValueTypes.Integer64),
        //        new Claim(JwtRegisteredClaimNames.Email, user.Email),
        //        new Claim(ClaimTypes.Role, user.RoleId.ToString())


        //    };

        //    var token = new JwtSecurityToken(
        //        issuer: jwtSettings["Issuer"],
        //        audience: jwtSettings["Audience"],
        //        claims: claims,
        //        expires: DateTime.UtcNow.AddMinutes(Convert.ToDouble(jwtSettings["ExpireMinutes"])),
        //        signingCredentials: creds
        //    );

        //    return new JwtSecurityTokenHandler().WriteToken(token);
        //}


        private string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        private bool VerifyPassword(string password, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }

        // =================== CHANGE PASSWORD (Authenticated User) ===================
        public async Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            // Verify current password
            if (!VerifyPassword(currentPassword, user.PasswordHash))
                return false;

            // Update with new password
            user.PasswordHash = HashPassword(newPassword);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Password changed successfully for user ID: {userId}");
            return true;
        }

        // =================== UPDATE EMAIL ===================
        public async Task<bool> UpdateEmailAsync(int userId, string newEmail)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            var oldEmail = user.Email;

            // Check if email is already taken by another user
            var existingUser = await _context.Users
                .AnyAsync(u => u.Email == newEmail && u.Id != userId);

            if (existingUser)
                return false;

            user.Email = newEmail;

            // Keep profile tables consistent with Users.Email.
            var resident = await _context.Residents.FirstOrDefaultAsync(r => r.UserId == userId);
            if (resident != null)
            {
                resident.Email = newEmail;
            }

            var staff = !string.IsNullOrWhiteSpace(oldEmail)
                ? await _context.Staffs.FirstOrDefaultAsync(s => s.Email == oldEmail)
                : null;
            if (staff != null)
            {
                staff.Email = newEmail;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Email updated successfully for user ID: {userId}");
            return true;
        }

        // =================== CREATE STAFF ACCOUNT BY ADMIN ===================
        public async Task<bool> CreateStaffAccountAsync(RegisterDto registerDto)
        {
            // Kiểm tra dữ liệu đầu vào
            if (registerDto.RoleId != 2)
                return false; // Chỉ cho phép tạo Staff

            var existingUser = await _context.Users
                .AnyAsync(u => u.UserName == registerDto.UserName || u.Email == registerDto.Email);

            if (existingUser)
                return false;

            // Tạo User account
            var user = new User
            {
                UserName = registerDto.UserName,
                PasswordHash = HashPassword(registerDto.Password),
                RoleId = 2, // Staff
                IsActive = true,
                Email = registerDto.Email
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync(); // Save để lấy user.Id

            // Tạo Staff profile
            var staff = new Staff
            {
                FullName = registerDto.FullName ?? user.UserName,
                Email = user.Email,
                Phone = registerDto.Phone ?? "",
                IdentityNumber = registerDto.IdentityNumber,
                Gender = registerDto.Gender,
                DateOfBirth = registerDto.DateOfBirth
            };

            _context.Staffs.Add(staff);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Admin created Staff account for user: {user.UserName} (ID: {user.Id})");
            return true;
        }

        // =================== SEED ADMIN USER ===================
        /// <summary>
        /// Tạo tài khoản Admin từ appsettings.json nếu chưa tồn tại
        /// </summary>
        public async Task SeedAdminUserAsync()
        {
            try
            {
                // Kiểm tra xem đã có Admin chưa
                var adminExists = await _context.Users.AnyAsync(u => u.RoleId == 1);
                
                if (adminExists)
                {
                    _logger.LogInformation("Admin account already exists. Skipping seed.");
                    return;
                }

                // Tạo Admin user từ config
                var adminUser = new User
                {
                    UserName = _adminConfig.Username,
                    Email = _adminConfig.Email,
                    PasswordHash = HashPassword(_adminConfig.Password),
                    RoleId = 1, // Admin role
                    IsActive = true
                };

                _context.Users.Add(adminUser);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ Admin account created successfully: {_adminConfig.Username} ({_adminConfig.Email})");
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error seeding admin user: {ex.Message}");
                throw;
            }
        }
    }
}
