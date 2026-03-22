using System.ComponentModel.DataAnnotations;

namespace SORMS.API.DTOs
{
    public class ReservationGuestDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string IdentityNumber { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public bool IsPrimaryGuest { get; set; }
    }

    public class ReservationDto
    {
        public int Id { get; set; }
        public int ResidentId { get; set; }
        public string ResidentName { get; set; } = string.Empty;
        public int RoomId { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public int NumberOfGuests { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime HoldExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public string? CancelReason { get; set; }
        public int? InvoiceId { get; set; }
        public List<ReservationGuestDto> Guests { get; set; } = new();
    }

    public class CreateReservationGuestDto
    {
        [Required, MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required, MaxLength(20)]
        public string IdentityNumber { get; set; } = string.Empty;

        [Required, MaxLength(15)]
        public string Phone { get; set; } = string.Empty;
    }

    public class CreateReservationDto
    {
        [Required]
        public int RoomId { get; set; }

        [Required]
        public DateTime CheckInDate { get; set; }

        [Required]
        public DateTime CheckOutDate { get; set; }

        [Range(1, 20)]
        public int NumberOfGuests { get; set; }

        [Required]
        public List<CreateReservationGuestDto> Guests { get; set; } = new();
    }

    public class ConfirmReservationPaymentDto
    {
        [Required]
        public long OrderCode { get; set; }
    }

    public class CancelReservationDto
    {
        [MaxLength(500)]
        public string? Reason { get; set; }
    }

    public class VerifyIdentityDto
    {
        [Required]
        public int ResidentId { get; set; }

        public bool IsVerified { get; set; }

        public string? IdentityDocumentUrl { get; set; }
    }
}
