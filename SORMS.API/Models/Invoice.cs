using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SORMS.API.Models
{
    public class Invoice
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int ResidentId { get; set; }

        [ForeignKey(nameof(ResidentId))]
        public Resident Resident { get; set; }

        public int? RoomId { get; set; }

        [ForeignKey(nameof(RoomId))]
        public Room? Room { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public int? VoucherId { get; set; }

        [ForeignKey(nameof(VoucherId))]
        public Voucher? Voucher { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [Required, MaxLength(255)]
        public string Description { get; set; }

        // Pending, Paid, Completed, Cancelled
        [Required, MaxLength(50)]
        public string Status { get; set; } = "Pending";

        [Required, MaxLength(30)]
        public string PaymentMethod { get; set; } = "PayOS";

        public long? PayOSOrderId { get; set; }

        // PayOS Payment Link ID or Checkout URL
        [MaxLength(1000)]
        public string? CheckoutUrl { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? BookingCheckInDate { get; set; }

        public DateTime? BookingCheckOutDate { get; set; }

        public int? BookingNumberOfResidents { get; set; }

        public DateTime? PaidAt { get; set; }
    }
}
