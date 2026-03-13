using System.ComponentModel.DataAnnotations;

namespace SORMS.API.DTOs
{
    public class NotificationDto
    {
        public int Id { get; set; }
        
        [Required(ErrorMessage = "Nội dung thông báo không được để trống")]
        [MaxLength(500, ErrorMessage = "Nội dung không được vượt quá 500 ký tự")]
        public string Message { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; }
        public bool IsRead { get; set; }
        
        // "Broadcast" hoặc "Individual"
        public string Type { get; set; } = "Individual";
        
        // "All", "Resident", "Staff" (cho broadcast)
        public string? TargetRole { get; set; }
        
        public int? ResidentId { get; set; }
        public int? StaffId { get; set; }
    }

    public class CreateBroadcastNotificationDto
    {
        [Required(ErrorMessage = "Nội dung thông báo không được để trống")]
        [MaxLength(500, ErrorMessage = "Nội dung không được vượt quá 500 ký tự")]
        public string Message { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng chọn đối tượng nhận thông báo")]
        public string TargetRole { get; set; } = "All"; // "All", "Resident", "Staff"
    }
}
