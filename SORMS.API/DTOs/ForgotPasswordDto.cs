using System.ComponentModel.DataAnnotations;

namespace SORMS.API.DTOs
{
    public class ForgotPasswordDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
    }
}
