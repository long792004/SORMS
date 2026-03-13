using System.ComponentModel.DataAnnotations;

namespace SORMS.API.DTOs
{
    public class VerifyOtpDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [MaxLength(10)]
        public string Otp { get; set; }
    }
}
