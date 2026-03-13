using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SORMS.API.Models
{
    public class Notification
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required, MaxLength(500)]
        public string Message { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public bool IsRead { get; set; }

        // Type: "Broadcast" (gửi cho tất cả) hoặc "Individual" (gửi cho 1 người)
        [Required, MaxLength(50)]
        public string Type { get; set; } = "Individual";

        // TargetRole: "All", "Resident", "Staff" (dùng cho broadcast)
        [MaxLength(50)]
        public string? TargetRole { get; set; }

        // FK: Resident (nullable cho broadcast notifications)
        public int? ResidentId { get; set; }

        [ForeignKey(nameof(ResidentId))]
        public Resident? Resident { get; set; }

        // FK: Staff (nullable, dùng khi gửi cho staff)
        public int? StaffId { get; set; }

        [ForeignKey(nameof(StaffId))]
        public Staff? Staff { get; set; }
    }
}
