using System.ComponentModel.DataAnnotations;

namespace SORMS.API.DTOs
{
    public class RoomInspectionDto
    {
        public int Id { get; set; }
        public int CheckInRecordId { get; set; }
        public int InspectedByUserId { get; set; }
        public DateTime InspectedAt { get; set; }
        public string FurnitureStatus { get; set; } = string.Empty;
        public string EquipmentStatus { get; set; } = string.Empty;
        public string RoomConditionStatus { get; set; } = string.Empty;
        public string Result { get; set; } = string.Empty;
        public decimal AdditionalFee { get; set; }
        public string? Notes { get; set; }
    }

    public class CreateRoomInspectionDto
    {
        [Required]
        public int CheckInRecordId { get; set; }

        [Required, MaxLength(20)]
        public string FurnitureStatus { get; set; } = "OK";

        [Required, MaxLength(20)]
        public string EquipmentStatus { get; set; } = "OK";

        [Required, MaxLength(20)]
        public string RoomConditionStatus { get; set; } = "OK";

        [Required, MaxLength(20)]
        public string Result { get; set; } = "OK";

        [Range(0, 100000000)]
        public decimal AdditionalFee { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }
    }
}
