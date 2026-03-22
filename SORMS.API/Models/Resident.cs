using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SORMS.API.Models
{
    public class Resident
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        // Link với User account (nullable - có thể tạo resident không có account)
        public int? UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        [Required, MaxLength(100)]
        public string FullName { get; set; }

        [Required, MaxLength(100), EmailAddress]
        public string Email { get; set; }

        [Required, MaxLength(15), Phone]
        public string Phone { get; set; }

        [Required, MaxLength(20)]
        public string IdentityNumber { get; set; }

        [MaxLength(1000)]
        public string? IdentityDocumentUrl { get; set; }

        public bool IdentityVerified { get; set; } = false;

        public DateTime? IdentityVerifiedAt { get; set; }

        public int? IdentityVerifiedByUserId { get; set; }

        [MaxLength(10)]
        public string? Gender { get; set; }

        public DateTime? DateOfBirth { get; set; }

        // Role của resident: Lecturer, Staff, Guest (không phải User Role)
        [MaxLength(20)]
        public string? Role { get; set; }

        [Required]
        public DateTime CheckInDate { get; set; }

        public DateTime? CheckOutDate { get; set; }

        // FK: Room (nullable - có thể chưa được assign phòng)
        public int? RoomId { get; set; }

        [ForeignKey(nameof(RoomId))]
        public Room? Room { get; set; }

        // Thông tin bổ sung
        [MaxLength(200)]
        public string? Address { get; set; }

        [MaxLength(15)]
        public string? EmergencyContact { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }

        public bool IsActive { get; set; } = true;

        // Navigation collections
        public ICollection<ServiceRequest> ServiceRequests { get; set; } = new List<ServiceRequest>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public ICollection<CheckInRecord> CheckInRecords { get; set; } = new List<CheckInRecord>();
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
        public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
        public ICollection<Rating> Ratings { get; set; } = new List<Rating>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
