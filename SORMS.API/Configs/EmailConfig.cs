namespace SORMS.API.Configs
{
    public class EmailConfig
    {
        public string SmtpServer { get; set; }       // Ví dụ: smtp.gmail.com
        public int Port { get; set; }                // Ví dụ: 587
        public string SenderEmail { get; set; }      // Email người gửi
        public string SenderName { get; set; }       // Tên hiển thị
        public string Username { get; set; }         // Tài khoản đăng nhập SMTP
        public string Password { get; set; }         // Mật khẩu hoặc App Password
        public bool EnableSsl { get; set; }          // Bật SSL/TLS
    }

}
