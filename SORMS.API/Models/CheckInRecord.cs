using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SORMS.API.Models
{
    public class CheckInRecord
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int ResidentId { get; set; }

        [ForeignKey(nameof(ResidentId))]
        public Resident Resident { get; set; }

        [Required]
        public int RoomId { get; set; }

        [ForeignKey(nameof(RoomId))]
        public Room Room { get; set; }

        [Required]
        public DateTime RequestTime { get; set; } // Thời gian yêu cầu

        [Required]
        public DateTime ExpectedCheckInDate { get; set; }

        [Required]
        public DateTime ExpectedCheckOutDate { get; set; }

        [Required]
        public int NumberOfResidents { get; set; } = 1;

        [MaxLength(120)]
        public string? BookerFullName { get; set; }

        [MaxLength(120)]
        public string? BookerEmail { get; set; }

        [MaxLength(30)]
        public string? BookerPhone { get; set; }

        [MaxLength(30)]
        public string? BookerIdentityNumber { get; set; }

        [MaxLength(1000)]
        public string? GuestList { get; set; }

        [MaxLength(50)]
        public string? BedPreference { get; set; }

        [MaxLength(50)]
        public string? SmokingPreference { get; set; }

        public bool EarlyCheckInRequested { get; set; } = false;

        public DateTime? ApprovedTime { get; set; } // Thời gian được phê duyệt

        public DateTime? CheckInTime { get; set; } // Thời gian check-in thực tế

        public DateTime? CheckOutRequestTime { get; set; } // Thời gian yêu cầu check-out

        public DateTime? CheckOutTime { get; set; } // Thời gian check-out thực tế

        [Required, MaxLength(50)]
        public string Status { get; set; } // PendingCheckIn, CheckedIn, PendingCheckOut, CheckedOut, Rejected

        [MaxLength(500)]
        public string? RejectReason { get; set; } // Lý do từ chối

        public int? ApprovedBy { get; set; } // Staff/Admin ID người phê duyệt (0 = Admin từ config, >0 = User trong DB)

        // ❌ KHÔNG dùng ForeignKey vì Admin (Id=0) không tồn tại trong database
        // [ForeignKey(nameof(ApprovedBy))]
        // public User? ApprovedByUser { get; set; }

        [Required, MaxLength(20)]
        public string RequestType { get; set; } // CheckIn, CheckOut

        public Review? Review { get; set; }
    }
}
