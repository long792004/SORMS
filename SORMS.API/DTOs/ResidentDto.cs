namespace SORMS.API.DTOs
{
    public class ResidentDto
    {
        public int Id { get; set; }
        public int? UserId { get; set; } // Link với User account
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty; // Alias for Phone
        public string IdentityNumber { get; set; } = string.Empty;
        public string? Role { get; set; } // Lecturer, Staff, Guest (không bắt buộc)
        public int? RoomId { get; set; } // Nullable - có thể chưa được assign phòng
        public string? RoomNumber { get; set; }
        public DateTime? CheckInDate { get; set; } // Nullable
        public DateTime? CheckOutDate { get; set; }
        public bool? IsActive { get; set; } = true;
        public string? Address { get; set; }
        public string? EmergencyContact { get; set; }
        public string? Notes { get; set; }
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
