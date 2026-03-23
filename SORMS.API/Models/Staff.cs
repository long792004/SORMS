using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SORMS.API.Models
{
    public class Staff
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string FullName { get; set; } = default!;

        [Required, MaxLength(150), EmailAddress]
        public string Email { get; set; } = default!;

        [Required, MaxLength(20), Phone]
        public string Phone { get; set; } = default!;

        [MaxLength(20)]
        public string? IdentityNumber { get; set; }

        [MaxLength(10)]
        public string? Gender { get; set; }

        public DateTime? DateOfBirth { get; set; }

        // 1 Staff - N ServiceRequests
        public ICollection<ServiceRequest> AssignedRequests { get; set; } = new List<ServiceRequest>();

        public string? ResetOtp { get; set; }
        public DateTime? ResetOtpExpiry { get; set; }
    }
}
