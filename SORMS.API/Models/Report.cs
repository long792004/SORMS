using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SORMS.API.Models
{
    public class Report
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Title { get; set; }

        [Required]
        public DateTime GeneratedDate { get; set; }

        [Required]
        public string Content { get; set; }

        [Required, MaxLength(100)]
        public string CreatedBy { get; set; }

        // Staff ID who created the report
        public int? StaffId { get; set; }

        // Status: Pending, Reviewed, Rejected
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        // Admin feedback
        public string? AdminFeedback { get; set; }

        // Admin who reviewed
        [MaxLength(100)]
        public string? ReviewedBy { get; set; }

        // Review date
        public DateTime? ReviewedDate { get; set; }

        // Last update
        public DateTime LastUpdated { get; set; }
    }
}
