using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SORMS.API.Models
{
    public class ReservationGuest
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int ReservationId { get; set; }

        [ForeignKey(nameof(ReservationId))]
        public Reservation Reservation { get; set; } = null!;

        [Required, MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required, MaxLength(20)]
        public string IdentityNumber { get; set; } = string.Empty;

        [Required, MaxLength(15), Phone]
        public string Phone { get; set; } = string.Empty;

        public bool IsPrimaryGuest { get; set; } = false;
    }
}
