using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SORMS.API.Models
{
    public class ServiceRequest
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Title { get; set; }

        [Required, MaxLength(50)]
        public string ServiceType { get; set; }

        [MaxLength(500)]
        public string Description { get; set; }

        [Required]
        public DateTime RequestDate { get; set; }

        [Required, MaxLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, Approved, InProgress, Completed, Rejected

        // FK: Resident
        [Required]
        public int ResidentId { get; set; }

        [ForeignKey(nameof(ResidentId))]
        public Resident Resident { get; set; }

        // Staff feedback/response
        public string? StaffFeedback { get; set; }

        // Staff who reviewed
        [MaxLength(100)]
        public string? ReviewedBy { get; set; }

        // Review date
        public DateTime? ReviewedDate { get; set; }

        // Completion date
        public DateTime? CompletedDate { get; set; }

        // Last update
        public DateTime LastUpdated { get; set; }

        // Priority: Low, Normal, High, Urgent
        [MaxLength(20)]
        public string Priority { get; set; } = "Normal";
    }
}
