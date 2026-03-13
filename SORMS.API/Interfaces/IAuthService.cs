using SORMS.API.DTOs;

namespace SORMS.API.Interfaces
{
    public interface IAuthService
    {
        Task<string> LoginAsync(LoginDto loginDto);
        Task<string> RegisterAsync(RegisterDto registerDto);
        Task<UserDto> GetUserByUsernameAsync(string username);
        Task<UserDto> GetUserByEmailAsync(string email);

        Task<bool> SendOtpAsync(string email);

        Task<bool> VerifyOtpAsync(string email, string otp);

        Task<bool> ResetPasswordAsync(string email, string otp, string newPassword);

        Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword);

        Task<bool> UpdateEmailAsync(int userId, string newEmail);

        /// <summary>
        /// Tạo tài khoản Admin từ config nếu chưa tồn tại
        /// </summary>
        Task SeedAdminUserAsync();

        /// <summary>
        /// Admin tạo tài khoản cho Staff
        /// </summary>
        Task<bool> CreateStaffAccountAsync(RegisterDto registerDto);

    }

}
