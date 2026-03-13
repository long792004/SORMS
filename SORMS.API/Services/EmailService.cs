using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SORMS.API.Interfaces;

namespace SORMS.API.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            try
            {
                // 1️⃣ Đọc cấu hình SMTP
                var smtpHost = _configuration["Smtp:Host"];
                var smtpPort = int.Parse(_configuration["Smtp:Port"] ?? "587");
                var smtpUser = _configuration["Smtp:Username"];
                var smtpPass = _configuration["Smtp:Password"];
                var fromEmail = _configuration["Smtp:From"];

                // 2️⃣ Kiểm tra giá trị cấu hình
                if (string.IsNullOrWhiteSpace(fromEmail))
                    throw new ArgumentNullException(nameof(fromEmail), "⚠️ Cấu hình 'Smtp:From' bị thiếu trong appsettings.json");

                if (string.IsNullOrWhiteSpace(to))
                    throw new ArgumentException("⚠️ Địa chỉ email người nhận không hợp lệ.", nameof(to));

                // 3️⃣ Kiểm tra định dạng email
                var fromAddress = new MailAddress(fromEmail);
                var toAddress = new MailAddress(to);

                // 4️⃣ Cấu hình SmtpClient
                using (var client = new SmtpClient(smtpHost, smtpPort))
                {
                    client.EnableSsl = true;
                    client.Credentials = new NetworkCredential(smtpUser, smtpPass);

                    // 5️⃣ Tạo nội dung email
                    var mailMessage = new MailMessage(fromAddress, toAddress)
                    {
                        Subject = subject,
                        Body = body,
                        IsBodyHtml = true
                    };

                    // 6️⃣ Gửi email
                    await client.SendMailAsync(mailMessage);

                    _logger.LogInformation($"✅ Email đã được gửi tới: {to}");
                }
            }
            catch (FormatException ex)
            {
                _logger.LogError(ex, $"❌ Địa chỉ email không đúng định dạng. To: {to}");
                throw new FormatException("Email format is invalid. Please check 'Smtp:From' or receiver email.", ex);
            }
            catch (SmtpException ex)
            {
                _logger.LogError(ex, "❌ Lỗi SMTP khi gửi email (kiểm tra Host, Port, Username, Password).");
                throw new InvalidOperationException("SMTP configuration error. Check your appsettings.json and credentials.", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Lỗi không xác định khi gửi email.");
                throw;
            }
        }
    }
}
