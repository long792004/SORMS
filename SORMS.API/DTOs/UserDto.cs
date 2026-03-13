namespace SORMS.API.DTOs
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Role { get; set; }
        public string RoleName { get; set; } // Thêm để rõ ràng hơn
        public string Email { get; set; }
        public bool IsActive { get; set; }
    }

}
