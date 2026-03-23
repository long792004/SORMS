using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SORMS.API.Models
{
    public class Reservation
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int ResidentId { get; set; }

        [ForeignKey(nameof(ResidentId))]
        public Resident Resident { get; set; } = null!;

        [Required]
        public int RoomId { get; set; }

        [ForeignKey(nameof(RoomId))]
        public Room Room { get; set; } = null!;

        [Required]
        public DateTime CheckInDate { get; set; }

        [Required]
        public DateTime CheckOutDate { get; set; }

        [Required]
        public int NumberOfGuests { get; set; }

        [Required, MaxLength(30)]
        public string Status { get; set; } = "Held"; // Held, Confirmed, Cancelled, Expired, CheckedIn, CheckedOut

        [Required]
        public DateTime HoldExpiresAt { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ConfirmedAt { get; set; }

        [MaxLength(500)]
        public string? CancelReason { get; set; }

        public bool Reminder24hSent { get; set; } = false;
        
        public bool Reminder2hSent { get; set; } = false;

        public int? InvoiceId { get; set; }

        [ForeignKey(nameof(InvoiceId))]
        public Invoice? Invoice { get; set; }

        public ICollection<ReservationGuest> Guests { get; set; } = new List<ReservationGuest>();
    }
}
