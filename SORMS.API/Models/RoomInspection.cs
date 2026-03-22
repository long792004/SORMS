using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SORMS.API.Models
{
    public class RoomInspection
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int CheckInRecordId { get; set; }

        [ForeignKey(nameof(CheckInRecordId))]
        public CheckInRecord CheckInRecord { get; set; } = null!;

        [Required]
        public int InspectedByUserId { get; set; }

        [Required]
        public DateTime InspectedAt { get; set; } = DateTime.UtcNow;

        [Required, MaxLength(20)]
        public string FurnitureStatus { get; set; } = "OK"; // OK, Damaged, Missing

        [Required, MaxLength(20)]
        public string EquipmentStatus { get; set; } = "OK"; // OK, Damaged, Missing

        [Required, MaxLength(20)]
        public string RoomConditionStatus { get; set; } = "OK"; // OK, Damaged, Missing

        [Required, MaxLength(20)]
        public string Result { get; set; } = "OK"; // OK, Damaged, Missing

        [Column(TypeName = "decimal(18,2)")]
        public decimal AdditionalFee { get; set; } = 0;

        [MaxLength(1000)]
        public string? Notes { get; set; }
    }
}
