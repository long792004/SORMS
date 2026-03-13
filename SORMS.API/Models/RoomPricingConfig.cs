using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SORMS.API.Models
{
    public class RoomPricingConfig
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int RoomId { get; set; }

        [ForeignKey(nameof(RoomId))]
        public Room? Room { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal MonthlyRent { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ElectricityRate { get; set; } = 0; // Giá điện mỗi kWh

        [Column(TypeName = "decimal(18,2)")]
        public decimal WaterRate { get; set; } = 0; // Giá nước mỗi m3

        [Column(TypeName = "decimal(18,2)")]
        public decimal InternetFee { get; set; } = 0; // Phí internet

        [Column(TypeName = "decimal(18,2)")]
        public decimal MaintenanceFee { get; set; } = 0; // Phí bảo trì

        [Required]
        public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;

        public DateTime? EffectiveTo { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;

        // Thông tin người cập nhật
        public int? UpdatedByStaffId { get; set; }

        [ForeignKey(nameof(UpdatedByStaffId))]
        public Staff? UpdatedByStaff { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}
