using System.ComponentModel.DataAnnotations;

namespace SORMS.API.DTOs
{
    public class ResetPasswordDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [MaxLength(10)]
        public string Otp { get; set; }

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; }
    }
}
