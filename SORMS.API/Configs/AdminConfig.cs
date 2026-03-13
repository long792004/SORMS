namespace SORMS.API.Configs
{
    /// <summary>
    /// Cấu hình cho tài khoản Admin mặc định
    /// </summary>
    public class AdminConfig
    {
        public string Username { get; set; } = "admin";
        public string Email { get; set; } = "admin@sorms.com";
        public string Password { get; set; } = "Admin@123456";
        public string FullName { get; set; } = "System Administrator";
    }
}
