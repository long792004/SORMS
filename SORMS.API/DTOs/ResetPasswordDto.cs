using System.ComponentModel.DataAnnotations;

namespace SORMS.API.DTOs
{
    public class ResetPasswordDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = default!;

        [Required]
        [MaxLength(10)]
        public string Otp { get; set; } = default!;

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = default!;
    }
}
