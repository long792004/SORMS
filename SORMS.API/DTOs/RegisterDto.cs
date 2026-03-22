namespace SORMS.API.DTOs
{
    public class RegisterDto
    {
        public string Email { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int RoleId { get; set; }
        
        // Thông tin bổ sung cho Resident profile (optional)
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? IdentityNumber { get; set; }
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Address { get; set; }
        public string? EmergencyContact { get; set; }
    }
}
