using System.ComponentModel.DataAnnotations;

namespace SORMS.API.DTOs
{
    public class UpdateEmailDto
    {
        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; } = string.Empty;
    }
}
