namespace SORMS.API.DTOs
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = default!;
        public string Role { get; set; } = default!;
        public string RoleName { get; set; } = default!; // Thêm để rõ ràng hơn
        public string Email { get; set; } = default!;
        public bool IsActive { get; set; }
    }

}
