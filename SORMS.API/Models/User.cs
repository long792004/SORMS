using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SORMS.API.Models
{
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required, MaxLength(50)]
        public string UserName { get; set; }

        [Required, MaxLength(100), EmailAddress]
        public string Email { get; set; }

        [Required]
        public string PasswordHash { get; set; }

        // FK: Role
        [Required]
        public int RoleId { get; set; }

        [ForeignKey(nameof(RoleId))]
        public Role Role { get; set; }

        public bool IsActive { get; set; } = true;

        public string? ResetOtp { get; set; }
        public DateTime? ResetOtpExpiry { get; set; }

        // Navigation: Resident profile (nếu user có role Resident)
        public Resident? ResidentProfile { get; set; }
    }
}
