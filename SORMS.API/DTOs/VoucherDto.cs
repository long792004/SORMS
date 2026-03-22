using System.ComponentModel.DataAnnotations;

namespace SORMS.API.DTOs
{
    public class VoucherCreateDto
    {
        [Required, MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Description { get; set; }

        [Required, MaxLength(20)]
        public string DiscountType { get; set; } = string.Empty;

        [Range(0.01, double.MaxValue)]
        public decimal Value { get; set; }

        [Range(0, double.MaxValue)]
        public decimal MinInvoiceAmount { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? MaxDiscountAmount { get; set; }

        [Range(1, int.MaxValue)]
        public int UsageLimit { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class VoucherUpdateDto
    {
        [Required, MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Description { get; set; }

        [Required, MaxLength(20)]
        public string DiscountType { get; set; } = string.Empty;

        [Range(0.01, double.MaxValue)]
        public decimal Value { get; set; }

        [Range(0, double.MaxValue)]
        public decimal MinInvoiceAmount { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? MaxDiscountAmount { get; set; }

        [Range(1, int.MaxValue)]
        public int UsageLimit { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public bool IsActive { get; set; }
    }

    public class VoucherResponseDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string DiscountType { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public decimal MinInvoiceAmount { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public int UsageLimit { get; set; }
        public int UsedCount { get; set; }
        public int RemainingUsage { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}