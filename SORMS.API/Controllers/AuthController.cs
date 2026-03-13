using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SORMS.API.DTOs;
using SORMS.API.Interfaces;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace SORMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Đăng nhập và nhận JWT token
        /// </summary>
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.LoginAsync(loginDto);
            if (result == null)
                return Unauthorized("Sai tên đăng nhập Email hoặc mật khẩu.");

            // Lấy thông tin user để trả về Role (tìm theo Email)
            var user = await _authService.GetUserByEmailAsync(loginDto.Email);
            
            return Ok(new { 
                Token = result,
                UserId = user?.Id,
                UserRole = user?.RoleName,
                Username = user?.Username,
                Email = user?.Email,
                Message = "Đăng nhập thành công"
            });
        }

        /// <summary>
        /// Đăng ký tài khoản mới và nhận JWT token (Chỉ dành cho Resident)
        /// </summary>
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // ⛔ CHẶN ĐĂNG KÝ ADMIN (1) và STAFF (2)
            if (registerDto.RoleId == 1 || registerDto.RoleId == 2)
            {
                return BadRequest(new 
                { 
                    Message = "Không thể đăng ký tài khoản Admin hoặc Staff qua form đăng ký. Tài khoản Admin được quản lý bởi hệ thống, tài khoản Staff được tạo bởi Admin.",
                    Error = "Admin/Staff registration is not allowed"
                });
            }

            // ✅ CHỈ CHO PHÉP RESIDENT (3) hoặc GUEST (4)
            if (registerDto.RoleId != 3 && registerDto.RoleId != 4)
            {
                return BadRequest(new 
                { 
                    Message = "Role không hợp lệ. Chỉ được đăng ký Resident hoặc Guest.",
                    Error = "Invalid role"
                });
            }

            var token = await _authService.RegisterAsync(registerDto);
            if (token == null)
                return Conflict("Tên hoặc Email đăng nhập đã tồn tại.");

            // Lấy thông tin user vừa đăng ký để trả về Role
            var user = await _authService.GetUserByEmailAsync(registerDto.Email);

            return Ok(new { 
                Message = "Đăng ký thành công.", 
                Token = token,
                UserId = user?.Id,
                UserRole = user?.RoleName,
                Username = user?.Username,
                Email = user?.Email
            });
        }

        /// <summary>
        /// Lấy thông tin người dùng theo username
        /// </summary>
        [HttpGet("user/{username}")]
        public async Task<IActionResult> GetUser(string username)
        {
            var user = await _authService.GetUserByUsernameAsync(username);
            if (user == null)
                return NotFound("Không tìm thấy người dùng.");

            return Ok(user);
        }

        // ================= Forgot Password Flow =================

        /// <summary>
        /// Gửi OTP về email để reset mật khẩu
        /// </summary>
        [AllowAnonymous]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var success = await _authService.SendOtpAsync(dto.Email);
            if (!success)
                return NotFound("Email không tồn tại trong hệ thống.");

            return Ok("OTP đã được gửi về email.");
        }

        /// <summary>
        /// Xác minh OTP
        /// </summary>
        [AllowAnonymous]
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var isValid = await _authService.VerifyOtpAsync(dto.Email, dto.Otp);
            if (!isValid)
                return BadRequest("OTP không hợp lệ hoặc đã hết hạn.");

            return Ok("Xác minh OTP thành công.");
        }

        /// <summary>
        /// Reset mật khẩu bằng OTP
        /// </summary>
        [AllowAnonymous]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var success = await _authService.ResetPasswordAsync(dto.Email, dto.Otp, dto.NewPassword);
            if (!success)
                return BadRequest("Không thể reset mật khẩu. OTP sai hoặc đã hết hạn.");

            return Ok("Đặt lại mật khẩu thành công.");
        }

        /// <summary>
        /// Change password for authenticated user
        /// </summary>
        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized("Invalid token");

            var success = await _authService.ChangePasswordAsync(userId, dto.CurrentPassword, dto.NewPassword);
            if (!success)
                return BadRequest("Mật khẩu hiện tại không đúng");

            return Ok("Đổi mật khẩu thành công");
        }

        /// <summary>
        /// Update email for authenticated user (Admin/Staff)
        /// </summary>
        [Authorize]
        [HttpPut("update-email")]
        public async Task<IActionResult> UpdateEmail([FromBody] UpdateEmailDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized("Invalid token");

            var success = await _authService.UpdateEmailAsync(userId, dto.Email);
            if (!success)
                return BadRequest("Email đã được sử dụng bởi người dùng khác");

            return Ok("Cập nhật email thành công");
        }

        /// <summary>
        /// Seed Admin user (Development/Testing only)
        /// </summary>
        [AllowAnonymous]
        [HttpPost("seed-admin")]
        public async Task<IActionResult> SeedAdmin()
        {
            try
            {
                await _authService.SeedAdminUserAsync();
                return Ok("Admin user seeding completed");
            }
            catch (Exception ex)
            {
                return BadRequest($"Error seeding admin: {ex.Message}");
            }
        }

        /// <summary>
        /// Admin tạo tài khoản cho Staff
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("create-staff")]
        public async Task<IActionResult> CreateStaffAccount([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Chỉ cho phép tạo Staff
            if (registerDto.RoleId != 2)
            {
                return BadRequest(new 
                { 
                    Message = "Chỉ được tạo tài khoản Staff.",
                    Error = "Only Staff accounts can be created"
                });
            }

            var success = await _authService.CreateStaffAccountAsync(registerDto);
            if (!success)
                return Conflict("Tên đăng nhập hoặc Email đã tồn tại.");

            return Ok(new { Message = "Tạo tài khoản Staff thành công." });
        }
    }
}
