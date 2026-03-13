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
        public string FullName { get; set; }

        [Required, MaxLength(150), EmailAddress]
        public string Email { get; set; }

        [MaxLength(20), Phone]
        public string Phone { get; set; }

        // 1 Staff - N ServiceRequests
        public ICollection<ServiceRequest> AssignedRequests { get; set; } = new List<ServiceRequest>();

        public string? ResetOtp { get; set; }
        public DateTime? ResetOtpExpiry { get; set; }
    }
}
